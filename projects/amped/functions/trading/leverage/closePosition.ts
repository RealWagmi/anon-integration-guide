import { type Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, TransactionParams, getChainFromName } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { PositionRouter } from '../../../abis/PositionRouter.js';
import { Vault } from '../../../abis/Vault.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';
import { getPosition } from './getPosition.js';
import { getAllOpenPositions } from './getAllOpenPositions.js';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: Address;
    indexToken?: Address; // Optional - if not provided, closes all positions
    collateralToken?: Address; // Optional - if not provided, closes positions with any collateral
    isLong?: boolean; // Optional - if not provided, closes both long and short positions
    sizeDelta?: bigint; // Optional - if not provided, closes entire position
    slippageBps?: number; // Optional - defaults to 30 bps (0.3%)
    withdrawETH?: boolean; // Whether to withdraw in ETH (native token) or keep as wrapped
}

/**
 * Closes one or more leveraged positions on Amped Finance
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account address that owns the position
 * @param props.indexToken - Optional token being traded (e.g., WETH, ANON). If not provided, closes all positions
 * @param props.collateralToken - Optional token used as collateral. If not provided, closes positions with any collateral
 * @param props.isLong - Optional position type. If not provided, closes both long and short positions
 * @param props.sizeDelta - Optional amount to close (in USD, with 30 decimals). If not provided, closes entire position
 * @param props.slippageBps - Optional slippage tolerance in basis points (1 bps = 0.01%). Defaults to 30 (0.3%)
 * @param props.withdrawETH - Whether to withdraw in native token (S) instead of wrapped token
 * @param options - System tools for blockchain interactions
 * @returns Transaction result with position closure details
 */
export async function closePosition(
    { chainName, account, indexToken, collateralToken, isLong, sizeDelta, slippageBps = 30, withdrawETH = false }: Props,
    { getProvider, notify, sendTransactions }: FunctionOptions,
): Promise<FunctionReturn> {
    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) {
        return toResult(`Network ${chainName} not supported`, true);
    }
    if (chainName !== NETWORKS.SONIC) {
        return toResult('This function is only supported on Sonic chain', true);
    }

    try {
        await notify('Finding open positions to close...');

        // Get all open positions
        const longPositionsResult = await getAllOpenPositions(
            { chainName, account, isLong: true },
            { getProvider, notify, sendTransactions }
        );
        const shortPositionsResult = await getAllOpenPositions(
            { chainName, account, isLong: false },
            { getProvider, notify, sendTransactions }
        );

        if (!longPositionsResult.success || !shortPositionsResult.success) {
            return toResult('Failed to get open positions', true);
        }

        const longPositions = JSON.parse(longPositionsResult.data).positions || [];
        const shortPositions = JSON.parse(shortPositionsResult.data).positions || [];
        
        // Filter positions based on provided criteria
        const positionsToClose = [...longPositions, ...shortPositions].filter(position => {
            if (indexToken && position.indexToken.toLowerCase() !== indexToken.toLowerCase()) return false;
            if (collateralToken && position.collateralToken.toLowerCase() !== collateralToken.toLowerCase()) return false;
            if (typeof isLong === 'boolean' && position.isLong !== isLong) return false;
            // Skip positions with zero size
            if (position.position.size === '0.0' || position.position.size === '0' || parseFloat(position.position.size) === 0) return false;
            return true;
        });

        if (positionsToClose.length === 0) {
            return toResult('No matching positions found to close', true);
        }

        await notify(`Found ${positionsToClose.length} position(s) to close`);

        const provider = getProvider(chainId);
        const transactions: TransactionParams[] = [];

        // Process each position
        for (const position of positionsToClose) {
            await notify(`\nProcessing ${position.isLong ? 'long' : 'short'} position...`);
            await notify(`Index Token: ${position.indexToken}`);
            await notify(`Collateral Token: ${position.collateralToken}`);
            await notify(`Size: ${position.position.size} USD`);
            await notify(`Collateral: ${position.position.collateral} (${position.position.collateralUsd} USD)`);

            // Convert position size from string to bigint, handling zero values
            const positionSize = parseFloat(position.position.size);
            if (isNaN(positionSize) || positionSize === 0) {
                await notify('Invalid position size, skipping position');
                continue;
            }
            
            // Ensure we have a valid integer before converting to bigint
            const positionSizeScaled = Math.floor(positionSize * 1e30);
            if (!Number.isFinite(positionSizeScaled)) {
                await notify('Position size too large or invalid after scaling, skipping position');
                continue;
            }
            
            const positionSizeBigInt = BigInt(positionSizeScaled);
            const sizeToClose = sizeDelta || positionSizeBigInt;

            if (sizeToClose <= 0n) {
                await notify('Invalid size to close, skipping position');
                continue;
            }

            // Get current price and min execution fee
            const [currentPrice, minExecutionFee] = await Promise.all([
                provider.readContract({
                    address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
                    abi: VaultPriceFeed,
                    functionName: 'getPrice',
                    args: [position.indexToken, false, true, true],
                }) as Promise<bigint>,
                provider.readContract({
                    address: CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER,
                    abi: PositionRouter,
                    functionName: 'minExecutionFee',
                }) as Promise<bigint>,
            ]);

            if (!currentPrice || currentPrice === 0n) {
                await notify('Invalid current price, skipping position');
                continue;
            }

            const slippageMultiplier = position.isLong
                ? BigInt(10000 - (slippageBps * 2)) // For longs: accept prices down to (1 - 2*slippage)
                : BigInt(10000 + slippageBps); // For shorts: accept prices up to (1 + slippage)
            const acceptablePrice = (currentPrice * slippageMultiplier) / BigInt(10000);

            if (!acceptablePrice || acceptablePrice === 0n) {
                await notify('Invalid acceptable price calculated, skipping position');
                continue;
            }

            await notify(`Calculated prices for ${position.isLong ? 'long' : 'short'} position:
                Current price: ${currentPrice.toString()}
                Slippage multiplier: ${slippageMultiplier.toString()}
                Acceptable price: ${acceptablePrice.toString()}`);

            // Determine path based on tokens
            const path =
                position.collateralToken.toLowerCase() === position.indexToken.toLowerCase()
                    ? [position.collateralToken]
                    : [position.collateralToken, position.indexToken];

            if (!path || path.length === 0) {
                await notify('Invalid token path, skipping position');
                continue;
            }

            // Prepare transaction data
            try {
                // Convert all numeric values to bigint to avoid NaN
                const pathArray = path.map(addr => addr as Address);
                const indexTokenAddr = position.indexToken as Address;
                const collateralDelta = 0n;
                const sizeToCloseBigInt = BigInt(sizeToClose.toString());
                const isLongBool = position.isLong;
                const accountAddr = account as Address;
                const acceptablePriceBigInt = BigInt(acceptablePrice.toString());
                const minOutBigInt = 0n;
                const minExecutionFeeBigInt = BigInt(minExecutionFee.toString());
                const withdrawETHBool = Boolean(withdrawETH);
                const callbackAddr = '0x0000000000000000000000000000000000000000' as Address;

                const closePositionData = encodeFunctionData({
                    abi: PositionRouter,
                    functionName: 'createDecreasePosition',
                    args: [
                        pathArray,
                        indexTokenAddr,
                        collateralDelta,
                        sizeToCloseBigInt,
                        isLongBool,
                        accountAddr,
                        acceptablePriceBigInt,
                        minOutBigInt,
                        minExecutionFeeBigInt,
                        withdrawETHBool,
                        callbackAddr,
                    ],
                });

                if (!closePositionData) {
                    await notify('Failed to encode transaction data, skipping position');
                    continue;
                }

                await notify(`Transaction data prepared successfully:
                    Path: ${pathArray.join(' -> ')}
                    Size to close: ${sizeToCloseBigInt.toString()}
                    Acceptable price: ${acceptablePriceBigInt.toString()}
                    Min execution fee: ${minExecutionFeeBigInt.toString()}`);

                transactions.push({
                    target: CONTRACT_ADDRESSES[NETWORKS.SONIC].POSITION_ROUTER,
                    data: closePositionData,
                    value: minExecutionFeeBigInt,
                });
            } catch (error) {
                await notify(`Failed to prepare transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
                continue;
            }
        }

        if (transactions.length === 0) {
            return toResult('No transactions generated', true);
        }

        await notify('\nSending transactions...');

        const txResult = await sendTransactions({
            chainId: chainId,
            account,
            transactions,
        });

        if (!txResult.data) {
            return toResult('Failed to send transactions', true);
        }

        return toResult(
            JSON.stringify({
                success: true,
                txHashes: txResult.data,
                details: {
                    positionsCount: positionsToClose.length,
                    slippageBps,
                    withdrawETH,
                },
            }),
        );
    } catch (error) {
        if (error instanceof Error) {
            return toResult(`Failed to close positions: ${error.message}`, true);
        }
        return toResult('Failed to close positions: Unknown error', true);
    }
}
