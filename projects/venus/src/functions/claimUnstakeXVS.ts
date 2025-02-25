import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, encodeFunctionData, formatEther, parseEventLogs } from 'viem';
import { XVSVaultAbi } from '../abis/XVSVaultAbi';
import { XVS_STAKE_ADDRESS, XVS_STAKE_POOL, XVS_TOKEN, supportedChains } from '../constants';
import { validateWallet } from '../utils';
import { getAvailableToClaimUnstakeXVS } from './getAvailableToClaimUnstakeXVS';
const { getChainFromName } = EVM.utils;

interface Props {
	chainName: string;
	account: Address;
}

/**
 * Claims unstaked XVS tokens from the Venus protocol after the withdrawal lock period.
 *
 * @param props - Claim parameters including chain name and account
 * @param options - System tools for blockchain interactions
 * @returns Claim result containing the transaction details
 */
export async function claimUnstakeXVS({ chainName, account }: Props, options: FunctionOptions): Promise<FunctionReturn> {
	const {
		evm: { getProvider, sendTransactions },
		notify,
	} = options;

	const wallet = validateWallet({ account });
	if (!wallet.success) {
		return toResult(wallet.errorMessage, true);
	}

	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (supportedChains.indexOf(chainId) === -1) return toResult(`Venus protocol is not supported on ${chainName}`, true);

	const provider = getProvider(chainId);

	// Check available withdrawals
	const availableWithdrawals = await getAvailableToClaimUnstakeXVS({ chainName, account }, options);
	if (!availableWithdrawals.success) {
		return availableWithdrawals;
	}

	const withdrawalInfo = JSON.parse(availableWithdrawals.data).withdrawalInfo;
	if (Number(withdrawalInfo.availableAmount) === 0) {
		return toResult('No withdrawal requests available or lock period has not ended yet', true);
	}

	try {
		await notify('Preparing to claim unstaked XVS...');

		// Prepare executeWithdrawal transaction
		const executeWithdrawalTx: EVM.types.TransactionParams = {
			target: XVS_STAKE_ADDRESS[chainId],
			data: encodeFunctionData({
				abi: XVSVaultAbi,
				functionName: 'executeWithdrawal',
				args: [XVS_TOKEN[chainId], XVS_STAKE_POOL],
			}),
		};

		// Send transaction
		const result = await sendTransactions({
			chainId,
			account,
			transactions: [executeWithdrawalTx],
		});

		const withdrawalData = result.data[result.data.length - 1];
		if (result.isMultisig) {
			return toResult(withdrawalData.message);
		}

		const txHash = withdrawalData.hash;
		if (!txHash) return toResult('Transaction succeeded, but failed to receive tx hash', true);

		// Get transaction receipt and parse ExecutedWithdrawal event
		const receipt = await provider.getTransactionReceipt({ hash: txHash });

		const withdrawalLogs = parseEventLogs({
			abi: XVSVaultAbi,
			eventName: 'ExecutedWithdrawal',
			logs: receipt.logs,
		});

		if (withdrawalLogs.length === 0) {
			return toResult(`Transaction succeeded but no ExecutedWithdrawal event found. ${JSON.stringify(withdrawalData)}`, true);
		}

		const { amount } = withdrawalLogs[0].args;

		return toResult(`Successfully claimed ${formatEther(amount)} unstaked XVS. ${JSON.stringify(withdrawalData)}`);
	} catch (error) {
		return toResult(`Failed to claim unstaked XVS: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
	}
}
