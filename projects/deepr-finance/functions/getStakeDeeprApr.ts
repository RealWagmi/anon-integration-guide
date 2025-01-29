import { Address, formatUnits } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	toResult,
	getChainFromName,
} from '@heyanon/sdk';
import { supportedChains, ADDRESS } from '../constants';
import { rewardpoolAbi } from '../abis';

interface Props {
	chainName: string;
}

/**
 * Fetch APR for staking DEEPR.
 * @param props - The request parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function getStakeDeeprApr(
	{ chainName }: Props,
	{ notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Deepr Finance is not supported on ${chainName}`, true);

    // Accrued Interest calculation
    const provider = getProvider(chainId);

    const secondsPerDay = 86400;
    const daysPerYear = 365;

    const stakeRatePerSecond = await provider.readContract({
        address: ADDRESS.CONTRACT.REWARDPOOL as Address,
        abi: rewardpoolAbi,
        functionName: 'rewardsPerSec'
    }) as bigint;

    const stakeRatePerSecondNumber = parseFloat(formatUnits(stakeRatePerSecond, 18));

    const stakeApr = stakeRatePerSecondNumber * (secondsPerDay * daysPerYear) * 100;

	return toResult(`DEEPR staking APR - ${stakeApr}%.`);
}