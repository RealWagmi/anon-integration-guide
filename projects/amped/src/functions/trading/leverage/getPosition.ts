import { type PublicClient, formatUnits } from 'viem';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { Vault } from '../../../abis/Vault.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';
import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { getChainFromName } from '../../../utils.js';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: `0x${string}`;
    indexToken: `0x${string}`;
    collateralToken: `0x${string}`;
    isLong: boolean;
}

interface Position {
    size: string;
    collateral: string;
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
export async function getPosition({ chainName, account, indexToken, collateralToken, isLong }: Props, { notify, evm }: FunctionOptions): Promise<FunctionReturn> {
    try {
        // Validate chain using SDK helper
        const chainId = getChainFromName(chainName);
        if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
        if (chainName !== NETWORKS.SONIC) {
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
            return toResult('Invalid collateral token address', true);
        }

        await notify('Checking position...');

        const provider = evm.getProvider(chainId);

        // Get raw position data
        await notify('Fetching position data...');
        const position = await provider.readContract({
            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
            abi: Vault,
            functionName: 'getPosition',
            args: [account, collateralToken, indexToken, isLong],
        }) as [bigint, bigint, bigint, bigint, bigint, bigint, boolean, bigint];

        // Debug log
        await notify('Raw position data:');
        await notify(JSON.stringify(position.map(val => typeof val === 'bigint' ? val.toString() : val)));

        // Get current price with safe error handling
        await notify('Fetching current price...');
        const currentPrice = await provider.readContract({
            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
            abi: VaultPriceFeed,
            functionName: 'getPrice',
            args: [indexToken, false, true, false],
        }) as bigint;

        if (currentPrice === 0n) {
            return toResult('Invalid price data: price is zero', true);
        }

        // Get collateral token price
        await notify('Fetching collateral token price...');
        const collateralPrice = await provider.readContract({
            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
            abi: VaultPriceFeed,
            functionName: 'getPrice',
            args: [collateralToken, false, true, false],
        }) as bigint;

        if (collateralPrice === 0n) {
            return toResult('Invalid collateral price data: price is zero', true);
        }

        // Add type safety for position data
        if (!position || position.length < 8) {
            return toResult('Invalid position data returned from contract', true);
        }

        // Safely handle position values with destructuring and validation
        const [size, collateral, avgPrice, entryFunding, reserveAmount, realizedPnl, hasProfit, lastUpdated] = position;
        if (size === undefined || collateral === undefined || avgPrice === undefined || 
            entryFunding === undefined || reserveAmount === undefined || realizedPnl === undefined) {
            return toResult('Invalid position values returned from contract', true);
        }

        // Convert BigInt values to strings for calculations
        const sizeStr = formatUnits(size, 30);
        const collateralStr = formatUnits(collateral, 30);
        const avgPriceStr = formatUnits(avgPrice, 30);
        const currentPriceStr = formatUnits(currentPrice, 30);
        const collateralPriceStr = formatUnits(collateralPrice, 30);
        const realizedPnlStr = formatUnits(realizedPnl, 30);

        // Calculate collateral in USD
        const collateralUsd = (collateral * collateralPrice) / BigInt(1e30);
        const collateralUsdStr = formatUnits(collateralUsd, 30);

        // Initialize position metrics
        let unrealizedPnlUsd = '0';
        let unrealizedPnlPercentage = '0';
        let leverage = '0';
        let liquidationPrice = '0';

        if (size > 0n) {
            // Calculate PnL
            const priceDelta = isLong ? currentPrice - avgPrice : avgPrice - currentPrice;
            const unrealizedPnlBigInt = (size * priceDelta) / BigInt(1e30);
            unrealizedPnlUsd = formatUnits(unrealizedPnlBigInt, 30);

            // Calculate percentage only if collateral is not zero
            if (collateral > 0n) {
                const collateralUsdBigInt = collateral * collateralPrice / BigInt(1e30);
                if (collateralUsdBigInt > 0n) {
                    const percentage = (unrealizedPnlBigInt * BigInt(100) * BigInt(1e30)) / collateralUsdBigInt;
                    unrealizedPnlPercentage = formatUnits(percentage, 30);
                }
            }

            // Calculate leverage
            const sizeUsd = (size * currentPrice) / BigInt(1e30);
            if (collateral > 0n) {
                const leverageBigInt = (sizeUsd * BigInt(1e30)) / collateralUsd;
                leverage = formatUnits(leverageBigInt, 30);
            }

            // Calculate liquidation price
            if (collateral > 0n) {
                const leverageValue = Number(leverage);
                if (leverageValue > 0) {
                    const liquidationMultiplier = isLong 
                        ? 1 - (1 / leverageValue)
                        : 1 + (1 / leverageValue);
                    const avgPriceNumber = Number(avgPriceStr);
                    liquidationPrice = (avgPriceNumber * liquidationMultiplier).toString();
                }
            }
        }

        // Format position data
        const formattedPosition: Position = {
            size: sizeStr,
            collateral: collateralStr,
            collateralUsd: collateralUsdStr,
            averagePrice: avgPriceStr,
            currentPrice: currentPriceStr,
            entryFundingRate: entryFunding.toString(),
            hasProfit,
            realizedPnl: realizedPnlStr,
            unrealizedPnlUsd,
            unrealizedPnlPercentage,
            leverage,
            liquidationPrice,
            lastUpdated: lastUpdated ? new Date(Number(lastUpdated) * 1000).toISOString() : null,
        };

        // Log formatted position details
        await notify('\nPosition Details:');
        await notify(`Size: ${formattedPosition.size} USD`);
        await notify(`Collateral: ${formattedPosition.collateral} (${formattedPosition.collateralUsd} USD)`);
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
        };

        return toResult(JSON.stringify(response));
    } catch (error) {
        if (error instanceof Error) {
            return toResult(`Failed to get position: ${error.message}`, true);
        }
        return toResult('Failed to get position: Unknown error', true);
    }
} 