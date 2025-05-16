import { type PublicClient, formatUnits } from 'viem';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { Vault } from '../../../abis/Vault.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';
import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { getChainFromName, getTokenDecimals as sdkGetTokenDecimals, type TokenSymbol } from '../../../utils.js';
import { getTokenSymbol } from '../../../utils/tokens.js';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: `0x${string}`;
    indexToken: `0x${string}`;
    collateralToken: `0x${string}`;
    isLong: boolean;
}

interface Position {
    size: string;
    collateralAmount: string;
    collateralUsd: string;
    averagePrice: string;
    currentPrice: string;
    entryFundingRate: string;
    hasProfit: boolean;
    realizedPnl: string;
    unrealizedPnlUsd: string;
    unrealizedPnlPercentage: string;
    leverage: string;
    liquidationPrice: string;
    lastUpdated: string | null;
}

interface PositionResponse {
    success: boolean;
    position: Position;
    indexTokenAddress?: `0x${string}`;
    collateralTokenAddress?: `0x${string}`;
}

/**
 * Gets information about a specific perpetual trading position
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account address to check position for
 * @param props.indexToken - The token being traded (e.g., WETH, ANON)
 * @param props.collateralToken - The token used as collateral
 * @param props.isLong - Whether this is a long position
 * @param options - System tools for blockchain interactions
 * @returns Detailed information about the position including size, collateral, PnL, etc.
 */
export async function getPosition({ chainName, account, indexToken, collateralToken, isLong }: Props, { notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    try {
        const networkName = chainName.toLowerCase();
        // Validate chain using SDK helper
        const chainId = getChainFromName(chainName);
        if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
        if (networkName !== NETWORKS.SONIC) {
            return toResult('This function is only supported on Sonic chain', true);
        }

        // Validate addresses
        if (!account || account === '0x0000000000000000000000000000000000000000') {
            return toResult('Invalid account address', true);
        }

        if (!indexToken || indexToken === '0x0000000000000000000000000000000000000000') {
            return toResult('Invalid index token address', true);
        }

        if (!collateralToken || collateralToken === '0x0000000000000000000000000000000000000000') {
            return toResult('Invalid collateral token address (expected Wrapped Native for native collateral)', true);
        }

        await notify('Checking position...');

        const provider = getProvider(chainId);

        // Get raw position data
        await notify('Fetching position data...');
        const positionRaw = await provider.readContract({
            address: CONTRACT_ADDRESSES[networkName].VAULT,
            abi: Vault,
            functionName: 'getPosition',
            args: [account, collateralToken, indexToken, isLong],
        }) as [bigint, bigint, bigint, bigint, bigint, bigint, boolean, bigint];

        await notify('Raw position data (size, collateralValueUsd, avgPrice, entryFunding, reserveAmount, realizedPnl, hasProfit, lastUpdated):');
        await notify(JSON.stringify(positionRaw.map(val => typeof val === 'bigint' ? val.toString() : val)));

        await notify('Fetching current price (index token)...');
        const currentPriceRaw = await provider.readContract({
            address: CONTRACT_ADDRESSES[networkName].VAULT_PRICE_FEED,
            abi: VaultPriceFeed,
            functionName: 'getPrice',
            args: [indexToken, false, true, false],
        }) as bigint;

        if (currentPriceRaw === 0n) {
            return toResult('Invalid price data for index token: price is zero', true);
        }

        await notify('Fetching collateral token price...');
        const collateralPriceRaw = await provider.readContract({
            address: CONTRACT_ADDRESSES[networkName].VAULT_PRICE_FEED,
            abi: VaultPriceFeed,
            functionName: 'getPrice',
            args: [collateralToken, false, true, false],
        }) as bigint;

        if (collateralPriceRaw === 0n && collateralToken.toLowerCase() !== CONTRACT_ADDRESSES[networkName].WRAPPED_NATIVE_TOKEN?.toLowerCase()) {
            return toResult(`Invalid price data for collateral token ${collateralToken}: price is zero`, true);
        }

        if (!positionRaw || positionRaw.length < 8) {
            return toResult('Invalid position data returned from contract', true);
        }

        const [sizeUsd_raw, collateralUsd_raw, avgPrice_raw, entryFunding_raw, reserveAmount_raw, realizedPnl_raw, hasProfit_raw, lastUpdated_raw] = positionRaw;
        
        if ([sizeUsd_raw, collateralUsd_raw, avgPrice_raw, entryFunding_raw, reserveAmount_raw, realizedPnl_raw].some(val => val === undefined)) {
            return toResult('Invalid position values (undefined) returned from contract', true);
        }

        const sizeUsdStr = formatUnits(sizeUsd_raw, 30);
        const collateralUsdStr = formatUnits(collateralUsd_raw, 30);
        const avgPriceStr = formatUnits(avgPrice_raw, 30);
        const currentPriceStr = formatUnits(currentPriceRaw, 30);
        const realizedPnlStr = formatUnits(realizedPnl_raw, 30);

        // Calculate collateral token amount
        let collateralTokenAmountStr = '0';
        let collateralDecimals = 18;
        if (collateralToken.toLowerCase() === CONTRACT_ADDRESSES[networkName].WETH?.toLowerCase()) {
            collateralDecimals = 18;
        } else if (collateralToken.toLowerCase() === CONTRACT_ADDRESSES[networkName].WRAPPED_NATIVE_TOKEN?.toLowerCase()) {
            collateralDecimals = 18;
        } else if (collateralToken.toLowerCase() === CONTRACT_ADDRESSES[networkName].USDC?.toLowerCase()) {
            collateralDecimals = 6;
        }

        if (collateralPriceRaw > 0n) {
            const collateralAmountBigInt = (collateralUsd_raw * BigInt(10 ** collateralDecimals)) / collateralPriceRaw;
            collateralTokenAmountStr = formatUnits(collateralAmountBigInt, collateralDecimals);
        }

        let unrealizedPnlUsdStr = '0';
        let unrealizedPnlPercentageStr = '0';
        let leverageStr = '0';
        let liquidationPriceStr = '0';

        if (sizeUsd_raw > 0n) {
            const priceDelta_raw = isLong ? currentPriceRaw - avgPrice_raw : avgPrice_raw - currentPriceRaw;
            
            if (avgPrice_raw > 0n) {
                const pnlBigInt = (sizeUsd_raw * priceDelta_raw) / avgPrice_raw;
                unrealizedPnlUsdStr = formatUnits(pnlBigInt, 30);

                if (collateralUsd_raw > 0n) {
                    const percentage = (pnlBigInt * BigInt(100) * BigInt(10**30)) / collateralUsd_raw;
                    unrealizedPnlPercentageStr = formatUnits(percentage, 30);
                }
            }

            if (collateralUsd_raw > 0n) {
                const leverageBigInt = (sizeUsd_raw * BigInt(10**30)) / collateralUsd_raw;
                leverageStr = formatUnits(leverageBigInt, 30);
            }
        
            const numericLeverage = parseFloat(leverageStr);
            if (numericLeverage > 0) {
                if (sizeUsd_raw > 0n) {
                    const maintenanceMarginFraction = BigInt(8000);
                    if (isLong) {
                        const priceDropToLiquidate = (collateralUsd_raw * avgPrice_raw) / sizeUsd_raw;
                        const liqPriceRaw = avgPrice_raw - priceDropToLiquidate;
                        liquidationPriceStr = formatUnits(liqPriceRaw, 30);
                    } else {
                        const priceRiseToLiquidate = (collateralUsd_raw * avgPrice_raw) / sizeUsd_raw;
                        const liqPriceRaw = avgPrice_raw + priceRiseToLiquidate;
                        liquidationPriceStr = formatUnits(liqPriceRaw, 30);
                    }
                }
            }
        }

        const formattedPosition: Position = {
            size: sizeUsdStr,
            collateralAmount: collateralTokenAmountStr,
            collateralUsd: collateralUsdStr,
            averagePrice: avgPriceStr,
            currentPrice: currentPriceStr,
            entryFundingRate: entryFunding_raw.toString(),
            hasProfit: hasProfit_raw,
            realizedPnl: realizedPnlStr,
            unrealizedPnlUsd: unrealizedPnlUsdStr,
            unrealizedPnlPercentage: unrealizedPnlPercentageStr,
            leverage: leverageStr,
            liquidationPrice: liquidationPriceStr,
            lastUpdated: lastUpdated_raw > 0n ? new Date(Number(lastUpdated_raw) * 1000).toISOString() : null,
        };

        await notify('\nPosition Details (after client-side calculation):');
        await notify(`Size: ${formattedPosition.size} USD`);
        
        // Get collateral symbol for logging
        const collateralSymbolForLog = getTokenSymbol(collateralToken, networkName) || 'UNKNOWN_TOKEN';

        await notify(`Collateral: ${formattedPosition.collateralAmount} ${collateralSymbolForLog} (${formattedPosition.collateralUsd} USD)`);
        await notify(`Average Entry Price: ${formattedPosition.averagePrice} USD`);
        await notify(`Current Price: ${formattedPosition.currentPrice} USD`);
        await notify(`Leverage: ${formattedPosition.leverage}x`);
        await notify(`Liquidation Price: ${formattedPosition.liquidationPrice} USD`);
        await notify(`Has Profit: ${formattedPosition.hasProfit}`);
        await notify(`Realized PnL: ${formattedPosition.realizedPnl} USD`);
        await notify(`Unrealized PnL: ${formattedPosition.unrealizedPnlUsd} USD (${formattedPosition.unrealizedPnlPercentage}%)`);
        if (formattedPosition.lastUpdated) {
            await notify(`Last Updated: ${formattedPosition.lastUpdated}`);
        }

        const response: PositionResponse = {
            success: true,
            position: formattedPosition,
            indexTokenAddress: indexToken,
            collateralTokenAddress: collateralToken
        };

        return toResult(JSON.stringify(response));
    } catch (error) {
        if (error instanceof Error) {
            await notify(`Error in getPosition: ${error.message}`);
            return toResult(`Failed to get position: ${error.message}`, true);
        }
        await notify(`Unknown error in getPosition.`);
        return toResult('Failed to get position: Unknown error', true);
    }
} 