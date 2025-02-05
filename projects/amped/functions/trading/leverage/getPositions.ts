import { type PublicClient } from 'viem';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { Vault } from '../../../abis/Vault.js';
import { VaultPriceFeed } from '../../../abis/VaultPriceFeed.js';
import { FunctionOptions, FunctionReturn, toResult, getChainFromName } from '@heyanon/sdk';

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
    lastUpdated: Date | null;
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
export async function getPosition({ chainName, account, indexToken, collateralToken, isLong }: Props, { getProvider, notify }: FunctionOptions): Promise<FunctionReturn> {
    try {
        // Validate chain using SDK helper
        const chainId = getChainFromName(chainName);
        if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
        if (chainName !== NETWORKS.SONIC) {
            return toResult('This function is only supported on Sonic chain', true);
        }

        await notify('Checking position...');

        const publicClient = getProvider(chainId);

        // Get raw position data
        await notify('Fetching position data...');
        const position = (await publicClient.readContract({
            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
            abi: Vault,
            functionName: 'getPosition',
            args: [account, collateralToken, indexToken, isLong],
        })) as [bigint, bigint, bigint, bigint, boolean, bigint, bigint];

        // Get current price
        await notify('Fetching current price...');
        const currentPrice = (await publicClient.readContract({
            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
            abi: VaultPriceFeed,
            functionName: 'getPrice',
            args: [indexToken, false, true, true],
        })) as bigint;

        // Get collateral token price
        await notify('Fetching collateral token price...');
        const collateralPrice = (await publicClient.readContract({
            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED,
            abi: VaultPriceFeed,
            functionName: 'getPrice',
            args: [collateralToken, false, true, true],
        })) as bigint;

        // Calculate collateral in USD
        const collateralBigInt = BigInt(position[1]);
        const collateralUsdBigInt = collateralBigInt * BigInt(collateralPrice);
        const collateralUsd = Number(collateralBigInt) / Math.pow(10, 30);
        const collateralTokens = collateralUsd / (Number(collateralPrice) / Math.pow(10, 30));

        // Calculate unrealized PnL
        const sizeBigInt = BigInt(position[0]);
        const averagePriceBigInt = BigInt(position[2]);
        const currentPriceBigInt = BigInt(currentPrice);

        let unrealizedPnlUsd = 0;
        if (sizeBigInt > 0n) {
            const pnlBigInt = isLong ? sizeBigInt * (currentPriceBigInt - averagePriceBigInt) : sizeBigInt * (averagePriceBigInt - currentPriceBigInt);
            unrealizedPnlUsd = Number(pnlBigInt) / Math.pow(10, 60);
        }

        const unrealizedPnlPercentage = collateralUsd > 0 ? (unrealizedPnlUsd / collateralUsd) * 100 || 0 : 0;

        // Format unrealized PnL for BigInt conversion
        const unrealizedPnlFormatted =
            unrealizedPnlUsd === 0
                ? '0.0'
                : unrealizedPnlUsd < 0
                  ? `-${formatUnits(BigInt(Math.floor(Math.abs(unrealizedPnlUsd) * Math.pow(10, 30))), 30)}`
                  : formatUnits(BigInt(Math.floor(unrealizedPnlUsd * Math.pow(10, 30))), 30);

        // Log raw position data for debugging
        await notify('\nRaw Position Data:');
        await notify(`Size: ${position[0].toString()}`);
        await notify(`Collateral: ${position[1].toString()}`);
        await notify(`Average Price: ${position[2].toString()}`);
        await notify(`Entry Funding Rate: ${position[3].toString()}`);
        await notify(`Has Profit: ${position[4]}`);
        await notify(`Realized PnL: ${position[5].toString()}`);
        await notify(`Last Updated: ${position[6].toString()}`);

        // Format position data
        const formattedPosition: Position = {
            size: formatUnits(sizeBigInt, 30),
            collateral: collateralTokens.toFixed(8),
            collateralUsd: formatUnits(BigInt(Math.floor(collateralUsd * Math.pow(10, 30))), 30),
            averagePrice: formatUnits(averagePriceBigInt, 30),
            currentPrice: formatUnits(currentPriceBigInt, 30),
            entryFundingRate: position[3].toString(),
            hasProfit: position[4],
            realizedPnl: formatUnits(BigInt(position[5]), 30),
            unrealizedPnlUsd: unrealizedPnlFormatted,
            unrealizedPnlPercentage: unrealizedPnlPercentage === 0 ? '0.0' : unrealizedPnlPercentage.toFixed(2),
            lastUpdated: position[6] ? new Date(Number(position[6]) * 1000) : null,
        };

        // Log formatted position details
        await notify('\nFormatted Position Details:');
        await notify(`Size: ${Number(formattedPosition.size).toFixed(2)} USD`);
        await notify(
            `Collateral: ${Number(formattedPosition.collateral).toFixed(8)} ${
                collateralToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN ? 'S' : collateralToken === CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC ? 'USDC' : 'ANON'
            } (${Number(formattedPosition.collateralUsd).toFixed(2)} USD)`,
        );
        await notify(`Average Entry Price: ${Number(formattedPosition.averagePrice).toFixed(4)} USD`);
        await notify(`Current Price: ${Number(formattedPosition.currentPrice).toFixed(4)} USD`);
        await notify(`Entry Funding Rate: ${formattedPosition.entryFundingRate}`);
        await notify(`Has Profit: ${formattedPosition.hasProfit}`);
        await notify(`Realized PnL: ${Number(formattedPosition.realizedPnl).toFixed(4)} USD`);
        const unrealizedPnlDisplay = Number(formattedPosition.unrealizedPnlUsd);
        await notify(`Unrealized PnL: ${isNaN(unrealizedPnlDisplay) ? '0.0' : unrealizedPnlDisplay.toFixed(4)} USD (${formattedPosition.unrealizedPnlPercentage}%)`);
        if (formattedPosition.lastUpdated) {
            await notify(`Last Updated: ${formattedPosition.lastUpdated.toISOString()}`);
        }

        if (position[0] === 0n) {
            await notify('\nNo active position found (zero size).');
        } else {
            await notify(`\nActive position found with size: ${Number(formattedPosition.size).toFixed(2)} USD`);
        }

        return toResult(
            JSON.stringify(
                {
                    success: true,
                    position: formattedPosition,
                },
                (_, value) => (typeof value === 'bigint' ? value.toString() : typeof value === 'boolean' ? value : value),
            ),
        );
    } catch (error) {
        console.error('Error getting position:', error);
        return toResult(error instanceof Error ? `Failed to get position: ${error.message}` : 'Failed to get position. Please check your parameters and try again.', true);
    }
}

// Helper function to format units (similar to ethers.utils.formatUnits)
function formatUnits(value: bigint, decimals: number): string {
    const divisor = BigInt('1' + '0'.repeat(decimals));
    const quotient = value / divisor;
    const remainder = value % divisor;
    const remainderStr = remainder.toString().padStart(decimals, '0');
    return `${quotient}.${remainderStr}`;
} 