import axios from 'axios';
import { Address, isAddress, parseSignature, zeroAddress } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { ARBITRUM_CHAIN_ID, ARBITRUM_CHAIN_ID_HEX, hyperliquidPerps } from '../constants';
import { _getUsersVaultAddress } from './utils/_getUsersVaultAddress';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { _signL1Action } from './utils/_signL1Action';
import { _getOpenOrders } from './utils/_getOpenOrders';

interface Props {
    account: Address;
    id: number;
    vault?: string;
}

/**
 * Close the active order
 * @param account - User's wallet address
 * @param id - Order ID (OID)
 * @param vault - Add this if you want to do this action as the vault. Can be vault name or address.
 * @param options - SDK function options
 * @returns Promise resolving to function execution result
 */
export async function cancelOrder({ account, id, vault }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const {
        notify,
        evm: { signTypedDatas },
    } = options;
    try {
        await notify('Canceling order...');
        if (vault && !isAddress(vault)) {
            vault = await _getUsersVaultAddress(account, vault);
            if (!vault) return toResult('Invalid vault specified', true);
        }

        const privateKey = generatePrivateKey();
        const agentWallet = privateKeyToAccount(privateKey);
        {
            const nonce = Date.now();
            const action = {
                type: 'approveAgent',
                hyperliquidChain: 'Mainnet',
                signatureChainId: ARBITRUM_CHAIN_ID_HEX,
                agentAddress: agentWallet.address,
                agentName: 'funding_agent',
                nonce,
            };

            const types = {
                'HyperliquidTransaction:ApproveAgent': [
                    { name: 'hyperliquidChain', type: 'string' },
                    { name: 'agentAddress', type: 'address' },
                    { name: 'agentName', type: 'string' },
                    { name: 'nonce', type: 'uint64' },
                ],
            };

            const domain = {
                name: 'HyperliquidSignTransaction',
                version: '1',
                chainId: ARBITRUM_CHAIN_ID,
                verifyingContract: zeroAddress,
            };

            if (!signTypedDatas) {
                throw new Error('signTypedDatas is not available');
            }
            const signatureHex = await signTypedDatas([
                {
                    domain,
                    primaryType: 'HyperliquidTransaction:ApproveAgent',
                    types,
                    message: action,
                },
            ]);
            const signature = parseSignature(signatureHex[0]);
            let signatureSerializable;
            if (signature.v) {
                signatureSerializable = { r: signature.r, s: signature.s, yParity: signature.yParity, v: Number(signature.v) };
            } else {
                signatureSerializable = { r: signature.r, s: signature.s, yParity: signature.yParity };
            }
            await axios.post(
                'https://api.hyperliquid.xyz/exchange',
                {
                    action,
                    nonce,
                    signature: signatureSerializable,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
        }

        const allOrders = await _getOpenOrders((vault || account) as `0x${string}`);
        for(const order of allOrders){
            if(order.oid!=id)
                continue;
            const assetIndex = hyperliquidPerps[order.coin].assetIndex;
            if(!assetIndex){
                return toResult(`Unsupported asset!`, true);
            }

            const action = {
                type: 'cancel',
                cancels: [
                    {
                        a: assetIndex,
                        o: id,
                    },
                ],
            };
            const nonce = Date.now();
            const signature = await _signL1Action(action, nonce, true, agentWallet, (vault || undefined) as Address | undefined);
    
            const payload = {
                action,
                nonce,
                signature,
            };
            // @ts-ignore
            if (vault) payload.vaultAddress = vault;
            const res = await axios.post('https://api.hyperliquid.xyz/exchange', payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
    
            if (res.data.status === 'err') throw new Error(res?.data?.response);
    
            const errorMessage = res.data.response?.data?.statuses && (res.data.response.data.statuses[0]?.error || res.data.response.data.statuses[1]?.error);
            if (errorMessage) throw new Error(res?.data?.response);
    
            return toResult(`Successfully canceled order!`);
        }
        return toResult(`You don't have an order with that ID!`, true);
    } catch (error) {
        return toResult('Failed to cancel order on Hyperliquid. Please try again.', true);
    }
}
