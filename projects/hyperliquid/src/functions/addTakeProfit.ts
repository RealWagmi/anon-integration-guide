import axios from 'axios';
import { Address, isAddress, parseSignature, zeroAddress } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { ARBITRUM_CHAIN_ID, ARBITRUM_CHAIN_ID_HEX, DEFAULT_HYPERLIQUID_SLIPPAGE, hyperliquidPerps } from '../constants';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { _formatPrice } from './utils/_formatPrice';
import { _formatSize } from './utils/_formatSize';
import { _actionHash } from './utils/_actionHash';
import { _signL1Action } from './utils/_signL1Action';
import { _updateLeverage } from './utils/_updateLeverage';
import { _getUsersVaultAddress } from './utils/_getUsersVaultAddress';

interface Props {
    account: Address;
    asset: keyof typeof hyperliquidPerps;
    price: string;
    vault?: string;
}

/**
 * Creates a take profit trigger order on the full position of the specified asset
 * @param account - User's wallet address
 * @param asset - The asset to trade on Hyperliquid.
 * @param price - Price that triggers the take profit action
 * @param vault - Add this if you want to do this action as the vault. Can be vault name or address.
 * @param options - SDK function options
 * @returns Promise resolving to function execution result
 */
export async function addTakeProfit({ account, asset, price, vault }: Props, { evm: { signTypedDatas } }: FunctionOptions): Promise<FunctionReturn> {
    try {
        if (vault && !isAddress(vault)) {
            vault = await _getUsersVaultAddress(account, vault);
            if (!vault) return toResult('Invalid vault specified', true);
        }
        const perpInfo = hyperliquidPerps[asset];
        if (!perpInfo) {
            return toResult('That asset is not supported');
        }
        //
        // Check if user has already opened the position
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

        for (const { position } of assetPositions) {
            const { coin, szi } = position;
            if (coin == asset) {
                //
                // Creating the agent wallet
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

                //
                // Preparing, signing and sending the action to Hyperliquid
                //
                const slippageAmount = DEFAULT_HYPERLIQUID_SLIPPAGE * Number(price);
                const executionPrice = Number(szi) > 0 ? Number(price) - slippageAmount : Number(price) + slippageAmount;
                const formattedExecutionPrice = _formatPrice(executionPrice, perpInfo.szDecimals)
                    .replace(/(\.\d*?[1-9])0+$/g, '$1')
                    .replace(/\.0+$/g, '');
                const formattedSize = _formatSize(Math.abs(szi), perpInfo.szDecimals);
                const formattedPrice = _formatPrice(Number(price), perpInfo.szDecimals)
                    .replace(/(\.\d*?[1-9])0+$/g, '$1')
                    .replace(/\.0+$/g, '');

                const orders: any = [
                    {
                        a: perpInfo.assetIndex,
                        b: Number(szi) < 0,
                        p: formattedExecutionPrice,
                        s: formattedSize,
                        r: true,
                        t: {
                            trigger: {
                                isMarket: true,
                                triggerPx: formattedPrice,
                                tpsl: 'tp',
                            },
                        },
                    },
                ];
                const action = {
                    type: 'order',
                    orders,
                    grouping: 'positionTpsl',
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

                return toResult(`Successfully created take profit trigger!`);
            }
        }
        return toResult("You don't have position in that asset", true);
    } catch (error) {
        console.log(error);
        return toResult('Failed to create take profit trigger on Hyperliquid. Please try again.', true);
    }
}
