import { Address, formatUnits, type PublicClient } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, SECONDS_PER_YEAR, SupportedChain } from '../../constants.js';
import { RewardTracker } from '../../abis/RewardTracker.js';
import { RewardDistributor } from '../../abis/RewardDistributor.js';
import { VaultPriceFeed } from '../../abis/VaultPriceFeed.js';
import { GlpManager } from '../../abis/GlpManager.js';
import { getChainFromName, getTokenAddress } from '../../utils.js';

interface Props {
    chainName: string;
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

    // Get network contracts based on chainId
    const networkContracts = CONTRACT_ADDRESSES[chainId];
    
    // Keep uppercase version for display in log messages
    const displayNetwork = chainName.toUpperCase();

    // Validate account
    if (!account) {
        return toResult('Wallet not connected', true);
    }
    
    // Validate publicClient was passed
    if (!publicClient) {
        return toResult('Public client not provided in parameters', true);
    }

    try {
        // Use network-specific addresses from constants
        const rewardTrackerAddress = networkContracts.REWARD_TRACKER;
        const glpTokenAddress = networkContracts.GLP_TOKEN;
        // We'll check both distributors
        const ampRewardDistributorAddress = networkContracts.ALP_REWARD_DISTRIBUTOR;
        const lpRewardDistributorAddress = networkContracts.ALP_FEE_REWARD_DISTRIBUTOR;
        const vaultPriceFeedAddress = networkContracts.VAULT_PRICE_FEED;
        const wrappedNativeTokenSymbol = chainId === SupportedChain.SONIC ? 'WS' : 'WETH';
        const wrappedNativeTokenAddress = getTokenAddress(wrappedNativeTokenSymbol, chainName.toLowerCase());
        const glpManagerAddress = networkContracts.GLP_MANAGER;


        // Fetch all data using publicClient
        const totalSupply = await publicClient.readContract({
            address: glpTokenAddress,
            abi: RewardTracker, // GLP also uses RewardTracker ABI for totalSupply
            functionName: 'totalSupply',
        }) as bigint;

        if (!totalSupply || totalSupply === 0n) {
            return toResult('Invalid total supply: zero or undefined', true);
        }

        const ampTokensPerInterval = await publicClient.readContract({
            address: ampRewardDistributorAddress,
            abi: RewardDistributor,
            functionName: 'tokensPerInterval',
        }) as bigint;

        const lpTokensPerInterval = await publicClient.readContract({
            address: lpRewardDistributorAddress,
            abi: RewardDistributor,
            functionName: 'tokensPerInterval',
        }) as bigint;

        // Get reward token (wrapped native) price
        const rewardTokenPrice = await publicClient.readContract({
            address: vaultPriceFeedAddress,
            abi: VaultPriceFeed,
            functionName: 'getPrice',
            args: [wrappedNativeTokenAddress, false, true, false], 
        }) as bigint;

        // Get ALP price from GLP Manager
        const alpPrice = await publicClient.readContract({
            address: glpManagerAddress,
            abi: GlpManager,
            functionName: 'getPrice',
            args: [false],
        }) as bigint;
        
        // Calculate yearly rewards (tokensPerInterval is in 1e18)
        const ampYearlyRewards = ampTokensPerInterval * BigInt(SECONDS_PER_YEAR);
        const lpYearlyRewards = lpTokensPerInterval * BigInt(SECONDS_PER_YEAR);
        const totalYearlyRewards = ampYearlyRewards + lpYearlyRewards;
        
        // Calculate yearly rewards value in USD
        const ampYearlyRewardsUsd = (ampYearlyRewards * rewardTokenPrice) / BigInt(1e30);
        const lpYearlyRewardsUsd = (lpYearlyRewards * rewardTokenPrice) / BigInt(1e30);
        const totalYearlyRewardsUsd = ampYearlyRewardsUsd + lpYearlyRewardsUsd;

        // Calculate total supply value in USD
        const totalSupplyUsd = (totalSupply * alpPrice) / BigInt(1e30);

        // Calculate base APR
        const ampRewardsUsdNumber = Number(formatUnits(ampYearlyRewardsUsd, 18));
        const lpRewardsUsdNumber = Number(formatUnits(lpYearlyRewardsUsd, 18));
        const totalRewardsUsdNumber = Number(formatUnits(totalYearlyRewardsUsd, 18));
        const totalSupplyUsdNumber = Number(formatUnits(totalSupplyUsd, 18));
        
        // Handle division by zero if total supply USD is 0
        const ampApr = totalSupplyUsdNumber === 0 ? 0 : (ampRewardsUsdNumber / totalSupplyUsdNumber) * 100;
        const lpApr = totalSupplyUsdNumber === 0 ? 0 : (lpRewardsUsdNumber / totalSupplyUsdNumber) * 100;
        const totalApr = ampApr + lpApr;

        // Calculate daily and weekly rewards in USD for better understanding
        const dailyRewardsUsd = totalYearlyRewardsUsd / BigInt(365);
        const weeklyRewardsUsd = totalYearlyRewardsUsd / BigInt(52);

        // Format numbers for output
        const ampYearlyRewardsFormatted = formatUnits(ampYearlyRewards, 18);
        const lpYearlyRewardsFormatted = formatUnits(lpYearlyRewards, 18);
        const totalYearlyRewardsFormatted = formatUnits(totalYearlyRewards, 18);
        
        const ampYearlyRewardsUsdFormatted = ampRewardsUsdNumber.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const lpYearlyRewardsUsdFormatted = lpRewardsUsdNumber.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const totalYearlyRewardsUsdFormatted = totalRewardsUsdNumber.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        const dailyRewardsUsdFormatted = Number(formatUnits(dailyRewardsUsd, 18)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const weeklyRewardsUsdFormatted = Number(formatUnits(weeklyRewardsUsd, 18)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const totalSupplyFormatted = Number(formatUnits(totalSupply, 18)).toLocaleString();
        const totalSupplyUsdFormatted = totalSupplyUsdNumber.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const alpPriceFormatted = Number(formatUnits(alpPrice, 30)).toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 });
        const rewardTokenPriceFormatted = Number(formatUnits(rewardTokenPrice, 30)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
        const rewardTokenSymbol = chainId === SupportedChain.SONIC ? 'wS' : 'WETH'; // Get symbol for logging

        return toResult(
            JSON.stringify({
                totalApr: totalApr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                ampApr: ampApr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                lpApr: lpApr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                totalYearlyRewards: totalYearlyRewardsFormatted,
                ampYearlyRewards: ampYearlyRewardsFormatted,
                lpYearlyRewards: lpYearlyRewardsFormatted,
                totalYearlyRewardsUsd: totalYearlyRewardsUsdFormatted,
                ampYearlyRewardsUsd: ampYearlyRewardsUsdFormatted,
                lpYearlyRewardsUsd: lpYearlyRewardsUsdFormatted,
                dailyRewardsUsd: dailyRewardsUsdFormatted,
                weeklyRewardsUsd: weeklyRewardsUsdFormatted,
                totalSupply: totalSupplyFormatted,
                totalSupplyUsd: totalSupplyUsdFormatted,
                alpPrice: alpPriceFormatted,
                ampTokensPerInterval: formatUnits(ampTokensPerInterval, 18),
                lpTokensPerInterval: formatUnits(lpTokensPerInterval, 18),
                rewardTokenPrice: rewardTokenPriceFormatted,
                rewardTokenSymbol: rewardTokenSymbol,
                raw: {
                    ampYearlyRewards: ampYearlyRewards.toString(),
                    lpYearlyRewards: lpYearlyRewards.toString(),
                    totalYearlyRewards: totalYearlyRewards.toString(),
                    ampYearlyRewardsUsd: ampYearlyRewardsUsd.toString(),
                    lpYearlyRewardsUsd: lpYearlyRewardsUsd.toString(),
                    totalYearlyRewardsUsd: totalYearlyRewardsUsd.toString(),
                    totalSupply: totalSupply.toString(),
                    totalSupplyUsd: totalSupplyUsd.toString(),
                    ampTokensPerInterval: ampTokensPerInterval.toString(),
                    lpTokensPerInterval: lpTokensPerInterval.toString(),
                    rewardTokenPrice: rewardTokenPrice.toString(),
                    alpPrice: alpPrice.toString(),
                },
            }),
        );
    } catch (error) {
        if (error instanceof Error) {
            return toResult(`Failed to get ALP APR information: ${error.message}`, true);
        }
        return toResult('Failed to get ALP APR information: Unknown error', true);
    }
}
