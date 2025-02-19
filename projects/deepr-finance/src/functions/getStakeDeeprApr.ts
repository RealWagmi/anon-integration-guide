import { formatUnits } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { CONTRACT, supportedChains } from '../constants';
import { rewardpoolAbi } from '../abis';
const { getChainFromName } = EVM.utils;

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
	options: FunctionOptions
): Promise<FunctionReturn> {
    const {
		evm: { getProvider },
		notify,
	} = options;

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Deepr Finance is not supported on ${chainName}`, true);

    // Accrued Interest calculation
    const provider = getProvider(chainId);

    const secondsPerDay = 86400;
    const daysPerYear = 365;

    const stakeRatePerSecond = await provider.readContract({
        address: CONTRACT.REWARDPOOL,
        abi: rewardpoolAbi,
        functionName: 'rewardsPerSec'
    }) as bigint;

    const stakeRatePerSecondNumber = parseFloat(formatUnits(stakeRatePerSecond, 18));

    const stakeApr = stakeRatePerSecondNumber * (secondsPerDay * daysPerYear) * 100;

	return toResult(`DEEPR staking APR - ${stakeApr}%.`);
}