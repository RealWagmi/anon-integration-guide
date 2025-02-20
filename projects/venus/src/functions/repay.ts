import { EVM, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, encodeFunctionData, erc20Abi, maxUint256, parseEther } from 'viem';

import { vBNBAbi } from '../abis/vBNBAbi';
import { vTokenAbi } from '../abis/vTokenAbi';
import { validateAndGetTokenDetails, validateWallet } from '../utils';
const { checkToApprove } = EVM.utils;
interface Props {
	chainName: string;
	account: Address;
	tokenSymbol: string;
	pool: string;
	amount: string | null;
	isFull: boolean | null;
}

/**
 * Repay Token using Venus protocol.
 *
 * @param props - repay parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Repay result containing the transaction hash.
 */
export async function repay({ chainName, account, amount, tokenSymbol, pool, isFull }: Props, options: FunctionOptions): Promise<FunctionReturn> {
	const {
		evm: { getProvider, sendTransactions },
		notify,
	} = options;
	const wallet = validateWallet({ account });
	if (!wallet.success) {
		return toResult(wallet.errorMessage, true);
	}

	// Validate repayment parameters
	if (isFull && amount) {
		return toResult('Cannot provide both amount and isFull=true', true);
	}
	if (!isFull && (!amount || typeof amount !== 'string' || isNaN(Number(amount)) || Number(amount) <= 0)) {
		return toResult('Must provide either a valid amount greater than 0 or set isFull=true', true);
	}

	let amountToRepayInWei = isFull ? maxUint256 : parseEther(amount!);
	// Validate chain
	const tokenDetails = validateAndGetTokenDetails({ chainName, pool, tokenSymbol: tokenSymbol });
	if (!tokenDetails.success) {
		return toResult(tokenDetails.errorMessage, true);
	}
	const provider = getProvider(tokenDetails.data.chainId);
	try {
		const transactions: EVM.types.TransactionParams[] = [];

		await notify('Preparing to repay Token...');
		let addZeroApprove = false;
		// Prepare repay borrowed transaction
		if (tokenDetails.data.isChainBased) {
			if (amountToRepayInWei === maxUint256) {
				amountToRepayInWei = await provider.readContract({
					abi: vBNBAbi,
					address: tokenDetails.data.tokenAddress,
					functionName: 'borrowBalanceStored',
					args: [account],
				});
			}
			const repayTx: EVM.types.TransactionParams = {
				target: tokenDetails.data.tokenAddress,
				data: encodeFunctionData({
					abi: vBNBAbi,
					functionName: 'repayBorrow',
					args: [],
				}),
				value: amountToRepayInWei,
			};
			transactions.push(repayTx);
		} else {
			const underlyingAssetAddress = (await provider.readContract({
				abi: vTokenAbi,
				address: tokenDetails.data.tokenAddress,
				functionName: 'underlying',
				args: [],
			})) as Address;

			const uToken = await provider.multicall({
				contracts: ['symbol', 'decimals'].map((functionName) => ({
					address: underlyingAssetAddress,
					abi: erc20Abi,
					functionName,
				})),
			});

			const [symbol_uToken, decimals_uToken] = uToken.map((result) => result.result) as [string, bigint];
			if (!symbol_uToken || !decimals_uToken)
				throw new Error(
					`Invalid ERC20 token contract at address ${underlyingAssetAddress}. Failed to fetch token details (symbol: ${symbol_uToken}, decimals: ${decimals_uToken})`,
				);

			await checkToApprove({
				args: {
					account,
					target: underlyingAssetAddress,
					spender: tokenDetails.data.tokenAddress,
					amount: amountToRepayInWei,
				},
				provider,
				transactions,
			});

			if (transactions.length > 0 && amountToRepayInWei === maxUint256) addZeroApprove = true;

			const repayTx: EVM.types.TransactionParams = {
				target: tokenDetails.data.tokenAddress,
				data: encodeFunctionData({
					abi: vTokenAbi,
					functionName: 'repayBorrow',
					args: [amountToRepayInWei],
				}),
			};
			transactions.push(repayTx);
			if (addZeroApprove) {
				transactions.push({
					target: underlyingAssetAddress,
					data: encodeFunctionData({
						abi: erc20Abi,
						functionName: 'approve',
						args: [tokenDetails.data.tokenAddress, 0n],
					}),
				});
			}
		}
		// Send transactions (to repay)
		const result = await sendTransactions({
			chainId: tokenDetails.data.chainId,
			account,
			transactions: transactions,
		});
		const repayData = result.data[addZeroApprove ? result.data.length - 2 : result.data.length - 1];
		// return toResult("Repaying Token...");
		return toResult(result.isMultisig ? repayData.message : `Successfully repaid ${amount ? amount : 'entire debt of'} ${tokenSymbol}. ${JSON.stringify(repayData)}`);
	} catch (error) {
		return toResult(`Failed to repay token: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
	}
}
