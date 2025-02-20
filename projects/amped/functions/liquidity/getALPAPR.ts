import { Address, formatUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS, PRECISION, SECONDS_PER_YEAR } from '../../constants.js';
import { RewardTracker } from '../../abis/RewardTracker.js';
import { RewardDistributor } from '../../abis/RewardDistributor.js';
import { VaultPriceFeed } from '../../abis/VaultPriceFeed.js';
import { GlpManager } from '../../abis/GlpManager.js';
import { getChainFromName } from '../../utils.js';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: Address;
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
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account address to check APR for
 * @param options - System tools for blockchain interactions
 * @returns APR information including base APR and reward rates
 */
export async function getALPAPR({ chainName, account }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) {
        return toResult(`Network ${chainName} not supported`, true);
    }
    if (chainName !== NETWORKS.SONIC) {
        return toResult('This function is only supported on Sonic chain', true);
    }

    // Validate account
    if (!account) {
        return toResult('Wallet not connected', true);
    }

    await options.notify('Checking ALP APR information...');

    try {
        const provider = options.evm.getProvider(chainId);
        const rewardTrackerAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_TRACKER;
        const rewardDistributorAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_DISTRIBUTOR;
        const vaultPriceFeedAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT_PRICE_FEED;
        const wrappedNativeTokenAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN;
        const glpManagerAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER;

        // Validate contract addresses
        if (!rewardTrackerAddress || !rewardDistributorAddress || !vaultPriceFeedAddress || !wrappedNativeTokenAddress || !glpManagerAddress) {
            return toResult('Required contract addresses not found', true);
        }

        await options.notify('Fetching total supply...');
        const totalSupply = await provider.readContract({
            address: rewardTrackerAddress,
            abi: RewardTracker,
            functionName: 'totalSupply',
        }) as bigint;

        if (!totalSupply || totalSupply === 0n) {
            return toResult('Invalid total supply: zero or undefined', true);
        }

        await options.notify('Fetching tokens per interval...');
        const tokensPerInterval = await provider.readContract({
            address: rewardDistributorAddress,
            abi: RewardDistributor,
            functionName: 'tokensPerInterval',
        }) as bigint;

        if (!tokensPerInterval) {
            return toResult('Invalid tokens per interval: undefined', true);
        }

        // Get reward token (wS) price
        await options.notify('Fetching reward token price...');
        const rewardTokenPrice = await provider.readContract({
            address: vaultPriceFeedAddress,
            abi: VaultPriceFeed,
            functionName: 'getPrice',
            args: [wrappedNativeTokenAddress, false, true, false],
        }) as bigint;

        // Calculate yearly rewards (tokensPerInterval is in 1e18)
        const yearlyRewards = tokensPerInterval * BigInt(SECONDS_PER_YEAR);
        
        // Calculate yearly rewards value in USD
        // rewardTokenPrice is in 1e30, yearlyRewards in 1e18
        // Result will be in 1e48, need to divide by 1e30 to get to 1e18
        const yearlyRewardsUsd = (yearlyRewards * rewardTokenPrice) / BigInt(1e30);

        // Get ALP price from GLP Manager
        await options.notify('Fetching ALP price...');
        const alpPrice = await provider.readContract({
            address: glpManagerAddress,
            abi: GlpManager,
            functionName: 'getPrice',
            args: [false],
        }) as bigint;

        // Calculate total supply value in USD
        // alpPrice is in 1e30, totalSupply in 1e18
        // Result will be in 1e48, need to divide by 1e30 to get to 1e18
        const totalSupplyUsd = (totalSupply * alpPrice) / BigInt(1e30);

        // Calculate base APR
        // Both yearlyRewardsUsd and totalSupplyUsd are in 1e18
        // Multiply by 100 for percentage
        const yearlyRewardsUsdNumber = Number(formatUnits(yearlyRewardsUsd, 18));
        const totalSupplyUsdNumber = Number(formatUnits(totalSupplyUsd, 18));
        const baseApr = (yearlyRewardsUsdNumber / totalSupplyUsdNumber) * 100;

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

        await options.notify('APR calculation completed');
        await options.notify(`Base APR: ${baseApr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`);
        await options.notify(`Yearly Rewards: ${formatUnits(yearlyRewards, 18)} wS ($${yearlyRewardsUsdFormatted})`);
        await options.notify(`Daily Rewards: ~$${dailyRewardsUsdFormatted}`);
        await options.notify(`Weekly Rewards: ~$${weeklyRewardsUsdFormatted}`);
        await options.notify(`Total Supply: ${totalSupplyFormatted} ALP`);
        await options.notify(`Total Supply Value: $${totalSupplyUsdFormatted}`);
        await options.notify(`ALP Price: $${alpPriceFormatted}`);
        await options.notify(`Tokens Per Interval: ${formatUnits(tokensPerInterval, 18)} wS/second`);
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
