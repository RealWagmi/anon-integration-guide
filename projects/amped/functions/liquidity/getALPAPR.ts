import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS, PRECISION, SECONDS_PER_YEAR } from '../../constants.js';
import { RewardTracker } from '../../abis/RewardTracker.js';
import { RewardDistributor } from '../../abis/RewardDistributor.js';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: Address;
}

/**
 * Gets APR information for ALP (Amped Liquidity Provider) tokens
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param props.account - The account address to check APR for
 * @param options - System tools for blockchain interactions
 * @returns APR information including base APR and reward rates
 */
export async function getALPAPR({ chainName, account }: Props, { getProvider, notify }: FunctionOptions): Promise<FunctionReturn> {
    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) {
        return toResult(`Network ${chainName} not supported`, true);
    }
    if (chainName !== NETWORKS.SONIC) {
        return toResult('This function is only supported on Sonic chain', true);
    }

    await notify('Checking ALP APR information...');

    try {
        const provider = getProvider(chainId);
        const rewardTrackerAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_TRACKER;
        const rewardDistributorAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_DISTRIBUTOR;

        await notify('Fetching total supply...');
        const totalSupply = await provider.readContract({
            address: rewardTrackerAddress,
            abi: RewardTracker,
            functionName: 'totalSupply',
        }) as bigint;

        await notify('Fetching tokens per interval...');
        const tokensPerInterval = await provider.readContract({
            address: rewardDistributorAddress,
            abi: RewardDistributor,
            functionName: 'tokensPerInterval',
        }) as bigint;

        // Calculate yearly rewards
        const yearlyRewards = tokensPerInterval * BigInt(SECONDS_PER_YEAR);

        // Calculate base APR (using PRECISION for better accuracy)
        const baseApr = Number((yearlyRewards * BigInt(PRECISION) * 100n) / totalSupply) / PRECISION;

        await notify('APR calculation completed');

        return toResult(
            JSON.stringify({
                baseApr: baseApr.toFixed(2),
                yearlyRewards: yearlyRewards.toString(),
                totalSupply: totalSupply.toString(),
                tokensPerInterval: tokensPerInterval.toString(),
            }),
        );
    } catch (error) {
        if (error instanceof Error) {
            return toResult(`Failed to get ALP APR information: ${error.message}`, true);
        }
        return toResult('Failed to get ALP APR information: Unknown error', true);
    }
}
