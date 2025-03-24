import axios from 'axios';
import { Address, isAddress, parseSignature, zeroAddress } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { ARBITRUM_CHAIN_ID, ARBITRUM_CHAIN_ID_HEX, hyperliquidPerps, MIN_HYPERLIQUID_TRADE_SIZE } from '../constants';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { _formatPrice } from './utils/_formatPrice';
import { _formatSize } from './utils/_formatSize';
import { _actionHash } from './utils/_actionHash';
import { _signL1Action } from './utils/_signL1Action';
import { _updateLeverage } from './utils/_updateLeverage';
import { _getUsersVaultAddress } from './utils/_getUsersVaultAddress';

interface Props {
    account: Address;
    vault: string;
    usd: number;
}

/**
 * Distributes the vault's perp balance to its depositors.
 * @param account - Vault manager's wallet address
 * @param name - Vault name or address
 * @param usd - USD amount that needs to be distributed
 * @param options - SDK function options
 * @returns Promise resolving to function execution result
 */
export async function distributeVault({ account, vault, usd }: Props, { evm: { signTypedDatas } }: FunctionOptions): Promise<FunctionReturn> {
    try {
        if (usd < 10) {
            return toResult(`Minimum distribute value is 10$`, true);
        }
        
        if (vault && !isAddress(vault)) {
            vault = await _getUsersVaultAddress(account, vault);
            if (!vault) return toResult('Invalid vault specified', true);
        }

        const res2 = await axios.post(
            'https://api.hyperliquid.xyz/info',
            { type: 'clearinghouseState', user: vault },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );

        const data = res2.data;

        if (usd > Math.min(data.marginSummary.accountValue - 100, data.withdrawable)) {
            return toResult(`Maximum distribute amount is ${Math.min(data.marginSummary.accountValue - 100, data.withdrawable)}$`, true);
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

        const nonce = Date.now();
        const action = {
            type: 'vaultDistribute',
            vaultAddress: vault,
            usd: Math.round(usd * 1000000),
        };

        const signature = await _signL1Action(action, nonce, true, agentWallet);

        const res = await axios.post(
            'https://api.hyperliquid.xyz/exchange',
            {
                action,
                nonce,
                signature,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );

        if (res.data.status === 'err') throw new Error(res?.data?.response);

        const errorMessage = res.data.response?.data?.statuses && (res.data.response.data.statuses[0]?.error || res.data.response.data.statuses[1]?.error);

        if (errorMessage) throw new Error(res?.data?.response);

        return toResult(`Successfully distributed vault funds!`);
    } catch (error) {
        console.log(error);
        return toResult('Failed to distributed vault funds on Hyperliquid. Please try again.', true);
    }
}
