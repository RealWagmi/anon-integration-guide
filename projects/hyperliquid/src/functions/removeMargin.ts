import axios from 'axios';
import { Address, isAddress, parseSignature, zeroAddress } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { ARBITRUM_CHAIN_ID, ARBITRUM_CHAIN_ID_HEX, hyperliquidPerps } from '../constants';
import { _getUsersVaultAddress } from './utils/_getUsersVaultAddress';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { _signL1Action } from './utils/_signL1Action';

interface Props {
    account: Address;
    asset: keyof typeof hyperliquidPerps;
    amount: string;
    vault?: string;
}

/**
 * Removes (decreases) unnecessary margin from the perp position so it can be put in better use.
 * @param account - User's wallet address
 * @param asset - The position that user wants to modify the margin for
 * @param amount - The amount of USD to remove from the margin
 * @param vault - Add this if you want to do this action as the vault. Can be vault name or address.
 * @param options - SDK function options
 * @returns Promise resolving to function execution result
 */
export async function removeMargin({ account, asset, amount, vault }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const {
        notify,
        evm: { signTypedDatas },
    } = options;
    try {
        await notify('Preparing to modify perpetual position...');
        if (vault && !isAddress(vault)) {
            vault = await _getUsersVaultAddress(account, vault);
            if (!vault) return toResult('Invalid vault specified', true);
        }
        //
        // Firstly, check if user has the position in that asset
        //
        const resultClearingHouseState = await axios.post(
            'https://api.hyperliquid.xyz/info',
            { type: 'clearinghouseState', user: vault || account },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );
        const { assetPositions } = resultClearingHouseState.data;
        const usdAmount = Number(amount);

        for (const { position } of assetPositions) {
            const { coin } = position;
            if (coin == asset) {
                //
                // Creating the Agent wallet
                //
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

                const action = {
                    type: 'updateIsolatedMargin',
                    asset: hyperliquidPerps[asset].assetIndex,
                    isBuy: false,
                    ntli: -usdAmount * 10 ** 6,
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

                return toResult(`Successfully removed margin!`);
            }
        }
        return toResult("You don't have a perp in that asset.", true);
    } catch (error) {
        // @ts-ignore
        if (error?.message) {
            // @ts-ignore
            notify(error?.message);
        }
        return toResult('Failed to modify position on Hyperliquid. Please try again.', true);
    }
}
