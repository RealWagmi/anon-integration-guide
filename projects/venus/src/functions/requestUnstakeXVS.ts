import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, encodeFunctionData, parseUnits } from 'viem';
import { XVSVaultAbi } from '../abis/XVSVaultAbi';
import { XVS_STAKE_ADDRESS, XVS_STAKE_POOL, XVS_TOKEN, supportedChains } from '../constants';
import { validateWallet } from '../utils';

const { getChainFromName } = EVM.utils;
interface Props {
	chainName: string;
	account: Address;
	amount: string;
}

/**
 * Request to unstake XVS tokens from the Venus protocol.
 *
 * @param props - Unstaking request parameters:
 *   - chainName: The blockchain network name
 *   - account: The wallet address requesting the unstake
 *   - amount: The amount of XVS tokens to unstake
 * @param options - System tools for blockchain interactions
 * @returns Result containing the transaction status and message
 */
export async function requestUnstakeXVS({ chainName, account, amount }: Props, options: FunctionOptions): Promise<FunctionReturn> {
	const {
		evm: { sendTransactions },
		notify,
	} = options;
	const wallet = validateWallet({ account });
	if (!wallet.success) {
		return toResult(wallet.errorMessage, true);
	}
	if (!amount || typeof amount !== 'string' || isNaN(Number(amount)) || Number(amount) <= 0) {
		return toResult('Amount must be a valid number greater than 0', true);
	}
	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (supportedChains.indexOf(chainId) === -1) return toResult(`Venus protocol is not supported on ${chainName}`, true);

	try {
		await notify('Preparing to unStake Token...');
		const transactions: EVM.types.TransactionParams[] = [];
		const unstakeTx: EVM.types.TransactionParams = {
			target: XVS_STAKE_ADDRESS[chainId],
			data: encodeFunctionData({
				abi: XVSVaultAbi,
				functionName: 'requestWithdrawal',
				args: [XVS_TOKEN[chainId], XVS_STAKE_POOL, parseUnits(amount, 18)],
			}),
		};
		transactions.push(unstakeTx);
		// Send transactions (to mint)
		const result = await sendTransactions({
			chainId: chainId,
			account,
			transactions: transactions,
		});
		const unstakeData = result.data[result.data.length - 1];
		return toResult(result.isMultisig ? unstakeData.message : `Successfully create request for withdraw ${amount} XVS. ${JSON.stringify(unstakeData)}`);
	} catch (error) {
		return toResult(`Failed to request unstake: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
	}
}
