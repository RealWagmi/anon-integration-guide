import { Address, formatUnits, type PublicClient } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS, PRECISION, SECONDS_PER_YEAR, SupportedNetwork } from '../../constants.js';
import { RewardTracker } from '../../abis/RewardTracker.js';
import { RewardDistributor } from '../../abis/RewardDistributor.js';
import { VaultPriceFeed } from '../../abis/VaultPriceFeed.js';
import { GlpManager } from '../../abis/GlpManager.js';
import { getChainFromName, getTokenAddress } from '../../utils.js';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: Address;
    publicClient: PublicClient;
}

// Helper function for safe number conversion
function safeToNumber(value: unknown): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (typeof value === 'bigint') {
        try {
            return Number(value);
        } catch {
            return 0;
        }
    }
    return 0;
}

/**
 * Gets APR information for ALP (Amped Liquidity Provider) tokens
 * @param props - The function parameters, including publicClient
 * @param props.chainName - The name of the chain (sonic or base)
 * @param props.account - The account address to check APR for
 * @param props.publicClient - Viem Public Client for interacting with the blockchain
 * @param options - System tools (like notify)
 * @returns APR information including base APR and reward rates
 */
export async function getALPAPR(
    { chainName, account, publicClient }: Props, 
    options: FunctionOptions 
): Promise<FunctionReturn> {
    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) {
        return toResult(`Network ${chainName} not supported`, true);
    }

    const network = chainName.toUpperCase() as SupportedNetwork;
    const networkContracts = CONTRACT_ADDRESSES[network];

    // Validate account
    if (!account) {
        return toResult('Wallet not connected', true);
    }
    
    // Validate publicClient was passed
    if (!publicClient) {
        return toResult('Public client not provided in parameters', true);
    }

    await options.notify(`Checking ALP APR information on ${network}...`);

    try {
        // publicClient is now directly available from props
        
        // Use network-specific addresses
        const rewardTrackerAddress = networkContracts.REWARD_TRACKER;
        const rewardDistributorAddress = networkContracts.REWARD_DISTRIBUTOR;
        const vaultPriceFeedAddress = networkContracts.VAULT_PRICE_FEED;
        const wrappedNativeTokenSymbol = network === NETWORKS.SONIC ? 'WS' : 'WETH';
        const wrappedNativeTokenAddress = getTokenAddress(wrappedNativeTokenSymbol, network);
        const glpManagerAddress = networkContracts.GLP_MANAGER;

        // Validate contract addresses
        if (!rewardTrackerAddress || !rewardDistributorAddress || !vaultPriceFeedAddress || !wrappedNativeTokenAddress || !glpManagerAddress) {
            return toResult(`Required contract addresses not found for network ${network}`, true);
        }

        // Fetch data using publicClient
        await options.notify('Fetching total supply...');
        const totalSupply = await publicClient.readContract({
            address: rewardTrackerAddress,
            abi: RewardTracker,
            functionName: 'totalSupply',
        }) as bigint;

        if (!totalSupply || totalSupply === 0n) {
            return toResult('Invalid total supply: zero or undefined', true);
        }

        await options.notify('Fetching tokens per interval...');
        const tokensPerInterval = await publicClient.readContract({
            address: rewardDistributorAddress,
            abi: RewardDistributor,
            functionName: 'tokensPerInterval',
        }) as bigint;

        if (tokensPerInterval === undefined || tokensPerInterval === null) { 
            return toResult('Invalid tokens per interval: undefined or null', true);
        }

        // Get reward token (wrapped native) price
        await options.notify('Fetching reward token price...');
        const rewardTokenPrice = await publicClient.readContract({
            address: vaultPriceFeedAddress,
            abi: VaultPriceFeed,
            functionName: 'getPrice',
            args: [wrappedNativeTokenAddress, false, true, false], 
        }) as bigint;

        // Get ALP price from GLP Manager
        await options.notify('Fetching ALP price...');
        const alpPrice = await publicClient.readContract({
            address: glpManagerAddress,
            abi: GlpManager,
            functionName: 'getPrice',
            args: [false],
        }) as bigint;
        
        // Calculate yearly rewards (tokensPerInterval is in 1e18)
        const yearlyRewards = tokensPerInterval * BigInt(SECONDS_PER_YEAR);
        
        // Calculate yearly rewards value in USD
        const yearlyRewardsUsd = (yearlyRewards * rewardTokenPrice) / BigInt(1e30);

        // Calculate total supply value in USD
        const totalSupplyUsd = (totalSupply * alpPrice) / BigInt(1e30);

        // Calculate base APR
        const yearlyRewardsUsdNumber = Number(formatUnits(yearlyRewardsUsd, 18));
        const totalSupplyUsdNumber = Number(formatUnits(totalSupplyUsd, 18));
        
        // Handle division by zero if total supply USD is 0
        const baseApr = totalSupplyUsdNumber === 0 ? 0 : (yearlyRewardsUsdNumber / totalSupplyUsdNumber) * 100;

        // Calculate daily and weekly rewards in USD for better understanding
        const dailyRewardsUsd = yearlyRewardsUsd / BigInt(365);
        const weeklyRewardsUsd = yearlyRewardsUsd / BigInt(52);

        // Format numbers for output
        const yearlyRewardsUsdFormatted = yearlyRewardsUsdNumber.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const dailyRewardsUsdFormatted = Number(formatUnits(dailyRewardsUsd, 18)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const weeklyRewardsUsdFormatted = Number(formatUnits(weeklyRewardsUsd, 18)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const totalSupplyFormatted = Number(formatUnits(totalSupply, 18)).toLocaleString();
        const totalSupplyUsdFormatted = totalSupplyUsdNumber.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const alpPriceFormatted = Number(formatUnits(alpPrice, 30)).toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 });
        const rewardTokenPriceFormatted = Number(formatUnits(rewardTokenPrice, 30)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
        const rewardTokenSymbol = network === NETWORKS.SONIC ? 'wS' : 'WETH'; // Get symbol for logging

        await options.notify('APR calculation completed');
        await options.notify(`Base APR: ${baseApr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`);
        await options.notify(`Yearly Rewards: ${formatUnits(yearlyRewards, 18)} ${rewardTokenSymbol} ($${yearlyRewardsUsdFormatted})`);
        await options.notify(`Daily Rewards: ~$${dailyRewardsUsdFormatted}`);
        await options.notify(`Weekly Rewards: ~$${weeklyRewardsUsdFormatted}`);
        await options.notify(`Total Supply: ${totalSupplyFormatted} ALP`);
        await options.notify(`Total Supply Value: $${totalSupplyUsdFormatted}`);
        await options.notify(`ALP Price: $${alpPriceFormatted}`);
        await options.notify(`Tokens Per Interval: ${formatUnits(tokensPerInterval, 18)} ${rewardTokenSymbol}/second`);
        await options.notify(`Reward Token Price: $${rewardTokenPriceFormatted}`);

        return toResult(
            JSON.stringify({
                baseApr: baseApr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                yearlyRewards: formatUnits(yearlyRewards, 18),
                yearlyRewardsUsd: yearlyRewardsUsdFormatted,
                dailyRewardsUsd: dailyRewardsUsdFormatted,
                weeklyRewardsUsd: weeklyRewardsUsdFormatted,
                totalSupply: totalSupplyFormatted,
                totalSupplyUsd: totalSupplyUsdFormatted,
                alpPrice: alpPriceFormatted,
                tokensPerInterval: formatUnits(tokensPerInterval, 18),
                rewardTokenPrice: rewardTokenPriceFormatted,
                rewardTokenSymbol: rewardTokenSymbol,
                raw: {
                    yearlyRewards: yearlyRewards.toString(),
                    yearlyRewardsUsd: yearlyRewardsUsd.toString(),
                    totalSupply: totalSupply.toString(),
                    totalSupplyUsd: totalSupplyUsd.toString(),
                    tokensPerInterval: tokensPerInterval.toString(),
                    rewardTokenPrice: rewardTokenPrice.toString(),
                    alpPrice: alpPrice.toString(),
                },
            }),
        );
    } catch (error) {
        console.error('Error details:', error);
        if (error instanceof Error) {
            console.error('Error stack:', error.stack);
            return toResult(`Failed to get ALP APR information: ${error.message}`, true);
        }
        return toResult('Failed to get ALP APR information: Unknown error', true);
    }
}
