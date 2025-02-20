import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, encodeFunctionData, parseUnits } from 'viem';
import { XVSVaultAbi } from '../abis/XVSVaultAbi';
import { XVS_STAKE_ADDRESS, XVS_STAKE_POOL, XVS_TOKEN, supportedChains } from '../constants';
import { validateWallet } from '../utils';
const { checkToApprove, getChainFromName } = EVM.utils;

interface Props {
	chainName: string;
	account: Address;
	amount: string;
}

/**
 * Stake XVS tokens in the Venus protocol.
 *
 * @param props - Staking parameters:
 *   - chainName: The blockchain network name
 *   - account: The wallet address staking the tokens
 *   - amount: The amount of XVS tokens to stake
 * @param options - System tools for blockchain interactions
 * @returns Result containing the transaction status and message
 */
export async function stakeXVS({ chainName, account, amount }: Props, options: FunctionOptions): Promise<FunctionReturn> {
	const {
		evm: { getProvider, sendTransactions },
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
	const provider = getProvider(chainId);
	try {
		await notify('Preparing to Stake Token...');
		const transactions: EVM.types.TransactionParams[] = [];
		const underlyingAssetAddress = (await provider.readContract({
			abi: XVSVaultAbi,
			address: XVS_STAKE_ADDRESS[chainId],
			functionName: 'xvsAddress',
			args: [],
		})) as Address;

		await checkToApprove({
			args: {
				account,
				target: underlyingAssetAddress,
				spender: XVS_STAKE_ADDRESS[chainId],
				amount: parseUnits(amount, 18),
			},
			provider,
			transactions,
		});
		const stakeTx: EVM.types.TransactionParams = {
			target: XVS_STAKE_ADDRESS[chainId],
			data: encodeFunctionData({
				abi: XVSVaultAbi,
				functionName: 'deposit',
				args: [XVS_TOKEN[chainId], XVS_STAKE_POOL, parseUnits(amount, 18)],
			}),
		};
		transactions.push(stakeTx);
		// Send transactions (to mint)
		const result = await sendTransactions({
			chainId: chainId,
			account,
			transactions: transactions,
		});
		const stakeData = result.data[result.data.length - 1];
		return toResult(result.isMultisig ? stakeData.message : `Successfully deposited ${amount} XVS. ${JSON.stringify(stakeData)}`);
	} catch (error) {
		return toResult(`Failed to stake tokens: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
	}
}
