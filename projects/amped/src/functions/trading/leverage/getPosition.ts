import { type PublicClient, formatUnits } from 'viem';
import { CONTRACT_ADDRESSES, SupportedChain } from '../../../constants.js';
import { Vault } from '../../../abis/Vault.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';
import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { getChainFromName, getTokenDecimals as sdkGetTokenDecimals, getTokenAddress, type TokenSymbol } from '../../../utils.js';
import { getTokenSymbol } from '../../../utils/tokens.js';

interface Props {
    chainName: string;
    account: `0x${string}`;
    tokenSymbol: TokenSymbol;
    collateralTokenSymbol: TokenSymbol;
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
 * @param props.tokenSymbol - The symbol of the token being traded (e.g., WETH, ANON)
 * @param props.collateralTokenSymbol - The symbol of the token used as collateral
 * @param props.isLong - Whether this is a long position
 * @param options - System tools for blockchain interactions
 * @returns Detailed information about the position including size, collateral, PnL, etc.
 */
export async function getPosition({ chainName, account, tokenSymbol, collateralTokenSymbol, isLong }: Props, { notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    try {
        const networkName = chainName.toLowerCase();
        // Validate chain using SDK helper
        const chainId = getChainFromName(chainName);
        if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
        if (chainId !== SupportedChain.SONIC) {
            return toResult('This function is only supported on Sonic chain', true);
        }

        const provider = getProvider(chainId);
        
        // Get token addresses from symbols
        const indexToken = getTokenAddress(tokenSymbol, chainName);
        const collateralToken = getTokenAddress(collateralTokenSymbol, chainName);

        // Get raw position data
        const positionRaw = await provider.readContract({
            address: CONTRACT_ADDRESSES[chainId].VAULT,
            abi: Vault,
            functionName: 'getPosition',
            args: [account, collateralToken, indexToken, isLong],
        }) as [bigint, bigint, bigint, bigint, bigint, bigint, boolean, bigint];

        await notify('Raw position data (size, collateralValueUsd, avgPrice, entryFunding, reserveAmount, realizedPnl, hasProfit, lastUpdated):');
        await notify(JSON.stringify(positionRaw.map(val => typeof val === 'bigint' ? val.toString() : val)));

        await notify('Fetching current price (index token)...');
        const currentPriceRaw = await provider.readContract({
            address: CONTRACT_ADDRESSES[chainId].VAULT_PRICE_FEED,
            abi: VaultPriceFeed,
            functionName: 'getPrice',
            args: [indexToken, false, true, false],
        }) as bigint;

        if (currentPriceRaw === 0n) {
            return toResult('Invalid price data for index token: price is zero', true);
        }

        await notify('Fetching collateral token price...');
        const collateralPriceRaw = await provider.readContract({
            address: CONTRACT_ADDRESSES[chainId].VAULT_PRICE_FEED,
            abi: VaultPriceFeed,
            functionName: 'getPrice',
            args: [collateralToken, false, true, false],
        }) as bigint;

        if (collateralPriceRaw === 0n && collateralToken.toLowerCase() !== CONTRACT_ADDRESSES[chainId].WRAPPED_NATIVE_TOKEN?.toLowerCase()) {
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
        if (collateralToken.toLowerCase() === CONTRACT_ADDRESSES[chainId].WETH?.toLowerCase()) {
            collateralDecimals = 18;
        } else if (collateralToken.toLowerCase() === CONTRACT_ADDRESSES[chainId].WRAPPED_NATIVE_TOKEN?.toLowerCase()) {
            collateralDecimals = 18;
        } else if (collateralToken.toLowerCase() === CONTRACT_ADDRESSES[chainId].USDC?.toLowerCase()) {
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

        await notify(`Position: ${formattedPosition.size} USD, Leverage: ${formattedPosition.leverage}x, PnL: ${formattedPosition.unrealizedPnlUsd} USD`);

        const response: PositionResponse = {
            success: true,
            position: formattedPosition,
            indexTokenAddress: indexToken as `0x${string}`,
            collateralTokenAddress: collateralToken as `0x${string}`
        };

        return toResult(JSON.stringify(response));
    } catch (error) {
        if (error instanceof Error) {
            return toResult(`Failed to get position: ${error.message}`, true);
        }
        return toResult('Failed to get position: Unknown error', true);
    }
} 