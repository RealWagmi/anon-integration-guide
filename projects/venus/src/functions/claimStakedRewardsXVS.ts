import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, encodeFunctionData, formatEther, parseEventLogs } from 'viem';
import { XVSVaultAbi } from '../abis/XVSVaultAbi';
import { XVS_STAKE_ADDRESS, XVS_STAKE_POOL, XVS_TOKEN, supportedChains } from '../constants';
import { validateWallet } from '../utils';
const { getChainFromName } = EVM.utils;

interface Props {
	chainName: string;
	account: Address;
}

/**
 * Claims staked XVS rewards from the Venus protocol.
 *
 * @param props - Claim parameters including chain name and account
 * @param options - System tools for blockchain interactions
 * @returns Claim result containing the transaction details
 */
export async function claimStakedRewardsXVS({ chainName, account }: Props, options: FunctionOptions): Promise<FunctionReturn> {
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

	try {
		await notify('Preparing to claim XVS rewards...');

		// Prepare claim transaction
		const claimTx: EVM.types.TransactionParams = {
			target: XVS_STAKE_ADDRESS[chainId],
			data: encodeFunctionData({
				abi: XVSVaultAbi,
				functionName: 'claim',
				args: [account, XVS_TOKEN[chainId], XVS_STAKE_POOL],
			}),
		};

		// Send transaction
		const result = await sendTransactions({
			chainId,
			account,
			transactions: [claimTx],
		});

		const claimData = result.data[result.data.length - 1];
		if (result.isMultisig) {
			return toResult(claimData.message);
		}
		const txHash = claimData.hash;
		if (!txHash) return toResult('Transaction succeeded, but failed to receive tx hash', true);

		// Get transaction receipt and parse Claim event
		const receipt = await provider.getTransactionReceipt({ hash: txHash });

		const claimLogs = parseEventLogs({
			abi: XVSVaultAbi,
			eventName: 'Claim',
			logs: receipt.logs,
		});

		if (claimLogs.length === 0) {
			return toResult(`Transaction succeeded but no Claim event found. ${JSON.stringify(claimData)}`, true);
		}

		const { amount } = claimLogs[0].args;

		return toResult(`Successfully claimed ${formatEther(amount)} XVS rewards. ${JSON.stringify(claimData)}`);
	} catch (error) {
		return toResult(`Failed to claim rewards: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
	}
}
