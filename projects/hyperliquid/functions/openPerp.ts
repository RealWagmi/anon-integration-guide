import axios from 'axios';
import { Address, parseSignature, zeroAddress } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { ARBITRUM_CHAIN_ID, ARBITRUM_CHAIN_ID_HEX, hyperliquidPerps, MIN_HYPERLIQUID_TRADE_SIZE } from '../constants';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { _formatPrice } from './util/_formatPrice';
import { _formatSize } from './util/_formatSize';
import { _actionHash } from './util/_actionHash';
import { _signL1Action } from './util/_signL1Action';
import { _updateLeverage } from './util/_updateLeverage';

interface Props {
    account: Address;
    asset: keyof typeof hyperliquidPerps;
    size: string;
    sizeUnit: 'ASSET' | 'USD';
    leverage: number;
    short: boolean;
    closing?: boolean;
}

/**
 * Opens a perpetual position on Hyperliquid by signing and submitting a typed data transaction.
 * @param account - User's wallet address
 * @param asset - The asset to trade on Hyperliquid.
 * @param size - The size of the order; interpreted as asset units or USD depending on `sizeUnit`.
 * @param sizeUnit - Whether `size` is specified in asset units or in USD.
 * @param leverage - The leverage (multiplier) for the position.
 * @param short - Set to `true` for a short position, `false` for a long position.
 * @param options - SDK function options
 * @returns Promise resolving to function execution result
 */
export async function openPerp({ account, asset, size, sizeUnit, leverage, short, closing }: Props, { signTypedDatas }: FunctionOptions): Promise<FunctionReturn> {
    try {
        //
        // Check if user has already opened the position
        //
        const resultClearingHouseState = await axios.post(
            'https://api.hyperliquid.xyz/info',
            { type: 'clearinghouseState', user: account },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );
        const { assetPositions, withdrawable } = resultClearingHouseState.data;

        for (const { position } of assetPositions) {
            const { coin } = position;
            if (coin == asset && !closing) {
                return toResult('You already have a perp in that asset, close it in order to open a new one.', true);
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

        if (!closing && sizeUsd < MIN_HYPERLIQUID_TRADE_SIZE) return toResult(`Minimum order size is ${MIN_HYPERLIQUID_TRADE_SIZE}$`, true);
        if (!closing && sizeUsd / leverage > Number(withdrawable)) return toResult('Not enough USD on Hyperliquid', true);

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
        const slippageAmount = 0.03 * midPrice;
        const executionPrice = short ? midPrice - slippageAmount : midPrice + slippageAmount;
        const formattedExecutionPrice = _formatPrice(executionPrice, perpInfo.decimals).replace(/\.?0+$/, '');
        const formattedSize = _formatSize(sizeAsset, perpInfo.nSigFigs);

        const action = {
            type: 'order',
            orders: [
                {
                    a: perpInfo.assetIndex,
                    b: !short,
                    p: formattedExecutionPrice,
                    s: formattedSize,
                    r: false,
                    t: {
                        limit: {
                            tif: 'Ioc',
                        },
                    },
                },
            ],
            grouping: 'na',
        };
        const nonce = Date.now();

        const signature = await _signL1Action(action, nonce, true, agentWallet);

        await _updateLeverage(leverage, perpInfo.assetIndex, agentWallet);

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

        const { totalSz, avgPx } = res.data.response.data.statuses[0].filled ||
            res.data.response.data.statuses[1]?.filled || {
                totalSz: '0',
                avgPx: '0',
            };

        if (totalSz == '0') throw new Error('Could not open order');

        return toResult(`Successfully ${short ? 'sold' : 'bought'} ${size} ${asset} with ${leverage}x leverage, for average price of $${avgPx}!`);
    } catch (error) {
        console.log(error);
        return toResult('Failed to open position on Hyperliquid. Please try again.', true);
    }
}
