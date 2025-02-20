import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, formatEther } from 'viem';
import { XVSVaultAbi } from '../abis/XVSVaultAbi';
import { XVS_STAKE_ADDRESS, XVS_STAKE_POOL, XVS_TOKEN, supportedChains } from '../constants';
import { timeConverter, validateWallet } from '../utils';
const { getChainFromName } = EVM.utils;

interface Props {
	chainName: string;
	account: Address;
}

/**
 * Gets information about available XVS tokens that can be unstaked and claimed.
 *
 * @param props - Query parameters including chain name and account
 * @param options - System tools for blockchain interactions
 * @returns Information about available and pending withdrawal amounts
 */
export async function getAvailableToClaimUnstakeXVS({ chainName, account }: Props, options: FunctionOptions): Promise<FunctionReturn> {
	const {
		evm: { getProvider },
	} = options;

	const wallet = validateWallet({ account });
	if (!wallet.success) {
		return toResult(wallet.errorMessage, true);
	}

	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (supportedChains.indexOf(chainId) === -1) return toResult(`Venus protocol is not supported on ${chainName}`, true);

	const provider = getProvider(chainId);
	const currentTime = Math.floor(Date.now() / 1000);

	try {
		const withdrawalRequestsInfo = await provider.readContract({
			address: XVS_STAKE_ADDRESS[chainId],
			abi: XVSVaultAbi,
			functionName: 'getWithdrawalRequests',
			args: [XVS_TOKEN[chainId], XVS_STAKE_POOL, account],
		});

		let availableAmount = 0n;
		let pendingAmount = 0n;
		const pendingWithdrawals = [];

		// Process all withdrawal requests
		for (const request of withdrawalRequestsInfo) {
			if (request.amount > 0n) {
				if (request.lockedUntil < currentTime) {
					availableAmount += request.amount;
				} else {
					pendingAmount += request.amount;
					pendingWithdrawals.push({
						amount: formatEther(request.amount),
						unlocksAt: timeConverter(Number(request.lockedUntil)),
					});
				}
			}
		}

		const response = {
			message: `You have ${formatEther(availableAmount)} XVS available to claim and ${formatEther(pendingAmount)} XVS pending`,
			withdrawalInfo: {
				availableAmount: formatEther(availableAmount),
				pendingAmount: formatEther(pendingAmount),
				pendingWithdrawals: pendingWithdrawals,
			},
		};

		return toResult(JSON.stringify(response));
	} catch (error) {
		return toResult(`Failed to get available unstake amounts: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
	}
}
