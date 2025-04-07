import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, formatEther } from 'viem';
import { XVSVaultAbi } from '../abis/XVSVaultAbi';
import { XVS_STAKE_ADDRESS, XVS_STAKE_POOL, XVS_TOKEN, supportedChains } from '../constants';
import { validateWallet } from '../utils';
const { getChainFromName } = EVM.utils;

interface Props {
	chainName: string;
	account: Address;
}

/**
 * Get user's staked XVS balance and pending rewards in the Venus protocol.
 *
 * @param props - Parameters for checking stake info
 * @param options - System tools for blockchain interactions
 * @returns Stake information including staked balance and pending rewards
 */
export async function getStakeInfoXVS({ chainName, account }: Props, options: FunctionOptions): Promise<FunctionReturn> {
	const {
		evm: { getProvider },
		notify,
	} = options;

	// Validate wallet
	const wallet = validateWallet({ account });
	if (!wallet.success) {
		return toResult(wallet.errorMessage, true);
	}

	// Validate chain
	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (supportedChains.indexOf(chainId) === -1) return toResult(`Venus protocol is not supported on ${chainName}`, true);

	try {
		const provider = getProvider(chainId);
		await notify('Fetching XVS stake information...');
		const stakeAddress = XVS_STAKE_ADDRESS[chainId];
		const xvsTokenAddress = XVS_TOKEN[chainId];

		// Execute both contract calls in parallel
		const [userInfo, pendingRewards] = await Promise.all([
			provider.readContract({
				abi: XVSVaultAbi,
				address: stakeAddress,
				functionName: 'getUserInfo',
				args: [xvsTokenAddress, XVS_STAKE_POOL, account],
			}) as Promise<[bigint, bigint, bigint]>, // [amount, rewardDebt, pendingWithdrawals]

			provider.readContract({
				abi: XVSVaultAbi,
				address: stakeAddress,
				functionName: 'pendingReward',
				args: [xvsTokenAddress, XVS_STAKE_POOL, account],
			}) as Promise<bigint>,
		]);

		const stakeInfo = {
			stakedBalance: formatEther(userInfo[0]), // amount is at index 0
			pendingRewards: formatEther(pendingRewards),
		};

		return toResult(JSON.stringify(stakeInfo));
	} catch (error) {
		return toResult(`Failed to get stake info: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
	}
}
