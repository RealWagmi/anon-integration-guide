import axios from 'axios';
import { Address, isAddress, parseSignature, zeroAddress } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { ARBITRUM_CHAIN_ID, ARBITRUM_CHAIN_ID_HEX, DEFAULT_HYPERLIQUID_SLIPPAGE, hyperliquidPerps, MIN_HYPERLIQUID_TRADE_SIZE } from '../constants';
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
    size: string;
    sizeUnit: 'ASSET' | 'USD';
    leverage: number;
    short: boolean;
    closing?: boolean;
    updating?: boolean;
    limitPrice?: string;
    takeProfitPrice?: string;
    stopLossPrice?: string;
    vault?: string;
}

/**
 * Opens a perpetual position on Hyperliquid by signing and submitting a typed data transaction.
 * @param account - User's wallet address
 * @param asset - The asset to trade on Hyperliquid.
 * @param size - The size of the order; interpreted as asset units or USD depending on `sizeUnit`.
 * @param sizeUnit - Whether `size` is specified in asset units or in USD.
 * @param leverage - The leverage (multiplier) for the position.
 * @param short - Set to `true` for a short position, `false` for a long position.
 * @param limitPrice - Price if the user wants to execute a limit order instead of a market order.
 * @param vault - Add this if you want to do this action as the vault. Can be vault name or address.
 * @param options - SDK function options
 * @returns Promise resolving to function execution result
 */
export async function openPerp(
    { account, asset, size, sizeUnit, leverage, short, closing, updating, vault, limitPrice, takeProfitPrice, stopLossPrice }: Props,
    { evm: { signTypedDatas } }: FunctionOptions,
): Promise<FunctionReturn> {
    try {
        if (vault && !isAddress(vault)) {
            vault = await _getUsersVaultAddress(account, vault);
            if (!vault) return toResult('Invalid vault specified', true);
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
        const { assetPositions, withdrawable } = resultClearingHouseState.data;

        let openPosition;
        for (const { position } of assetPositions) {
            const { coin } = position;
            if (coin == asset && !closing && !updating) {
                // Disabled this one, it can be re-enabled or only triggered on non-limit orders
                // return toResult('You already have a perp in that asset, close it in order to open a new one.', true);
            }
            if (coin == asset) {
                openPosition = position;
            }
        }

        //
        // Get asset mid price
        //
        const perpInfo = hyperliquidPerps[asset];
        const resultMidPrice = await axios.post(
            'https://api.hyperliquid.xyz/info',
            { type: 'metaAndAssetCtxs' },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );
        const midPrice = Number(resultMidPrice.data[1][perpInfo.assetIndex].midPx);

        //
        // Calculate the actual size of order in USD and asset
        //
        let sizeUsd, sizeAsset;
        if (sizeUnit == 'USD') {
            sizeUsd = Number(size);
            sizeAsset = sizeUsd / midPrice;
        } else {
            sizeAsset = Number(size);
            sizeUsd = sizeAsset * midPrice;
        }

        if (!closing && Math.abs(sizeUsd) < MIN_HYPERLIQUID_TRADE_SIZE) return toResult(`Minimum order size is ${MIN_HYPERLIQUID_TRADE_SIZE}$`, true);
        if (!(updating && Number(size) < 0) && !closing && sizeUsd / leverage > Number(withdrawable)) return toResult('Not enough USD on Hyperliquid', true);
        if (updating && Number(size) < 0 && openPosition) {
            if (Math.abs(openPosition.positionValue) < -sizeUsd || Math.abs(openPosition.szi) < -sizeAsset)
                return toResult('Specified amount is larger than size of the opened position.', true);
        }
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
        const slippageAmount = DEFAULT_HYPERLIQUID_SLIPPAGE * midPrice;
        const executionPriceMarketOrder = (Number(sizeAsset) < 0 ? !short : short) ? midPrice - slippageAmount : midPrice + slippageAmount;
        const formattedExecutionPrice = _formatPrice(Number(limitPrice || '0') || executionPriceMarketOrder, perpInfo.szDecimals)
            .replace(/(\.\d*?[1-9])0+$/g, '$1')
            .replace(/\.0+$/g, '');
        const formattedSize = _formatSize(Math.abs(sizeAsset), perpInfo.szDecimals);

        const orders: any = [
            {
                a: perpInfo.assetIndex,
                b: Number(sizeAsset) < 0 ? short : !short,
                p: formattedExecutionPrice,
                s: formattedSize,
                r: closing || (updating && Number(size) < 0) ? true : false,
                t: {
                    limit: {
                        tif: limitPrice ? 'Gtc' : 'Ioc',
                    },
                },
            },
        ];

        if (stopLossPrice) {
            const formattedStopLossPrice = _formatPrice(Number(stopLossPrice), perpInfo.szDecimals)
                .replace(/(\.\d*?[1-9])0+$/g, '$1')
                .replace(/\.0+$/g, '');

            const stopLossExecutionPrice = Number(stopLossPrice) * (1 + DEFAULT_HYPERLIQUID_SLIPPAGE * (short ? 1 : -1));
            const formattedStopLossExecutionPrice = _formatPrice(stopLossExecutionPrice, perpInfo.szDecimals)
                .replace(/(\.\d*?[1-9])0+$/g, '$1')
                .replace(/\.0+$/g, '');
            orders.push({
                a: perpInfo.assetIndex,
                b: Number(sizeAsset) < 0 ? !short : short,
                p: formattedStopLossExecutionPrice,
                s: formattedSize,
                r: true,
                t: {
                    trigger: {
                        isMarket: true,
                        triggerPx: formattedStopLossPrice,
                        tpsl: 'sl',
                    },
                },
            });
        }
        if (takeProfitPrice) {
            const formattedTakeProfitPrice = _formatPrice(Number(takeProfitPrice), perpInfo.szDecimals)
                .replace(/(\.\d*?[1-9])0+$/g, '$1')
                .replace(/\.0+$/g, '');

            const takeProfitExecutionPrice = Number(takeProfitPrice) * (1 + DEFAULT_HYPERLIQUID_SLIPPAGE * (short ? 1 : -1));
            const formattedTakeProfitExecutionPrice = _formatPrice(takeProfitExecutionPrice, perpInfo.szDecimals)
                .replace(/(\.\d*?[1-9])0+$/g, '$1')
                .replace(/\.0+$/g, '');
            orders.push({
                a: perpInfo.assetIndex,
                b: Number(sizeAsset) < 0 ? !short : short,
                p: formattedTakeProfitExecutionPrice,
                s: formattedSize,
                r: true,
                t: {
                    trigger: {
                        isMarket: true,
                        triggerPx: formattedTakeProfitPrice,
                        tpsl: 'tp',
                    },
                },
            });
        }

        const action = {
            type: 'order',
            orders,
            grouping: takeProfitPrice || stopLossPrice ? 'normalTpsl' : 'na',
        };
        const nonce = Date.now();
        const signature = await _signL1Action(action, nonce, true, agentWallet, (vault || undefined) as Address | undefined);

        if (!closing && !updating) {
            const leverageUpdateSuccessful = await _updateLeverage(leverage, perpInfo.assetIndex, agentWallet, (vault || undefined) as Address | undefined);
            if (!leverageUpdateSuccessful) return toResult('Invalid leverage.', true);
        }

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

        const { totalSz, avgPx } = res.data.response.data.statuses[0].filled ||
            res.data.response.data.statuses[1]?.filled || {
                totalSz: '0',
                avgPx: '0',
            };

        if (totalSz == '0' && !limitPrice) throw new Error('Could not open order');

        if (limitPrice) {
            return toResult(`Successfully created order!`);
        }

        return toResult(
            `Successfully ${short ? 'sold' : 'bought'} ${sizeUnit == 'ASSET' ? formattedSize : sizeUsd} ${
                sizeUnit == 'ASSET' ? '' : 'USD of'
            } ${asset} with ${leverage}x leverage, for average price of $${avgPx}!`,
        );
    } catch (error) {
        console.log(error);
        return toResult('Failed to open position on Hyperliquid. Please try again.', true);
    }
}
