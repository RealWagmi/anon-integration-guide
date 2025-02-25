import { EVM, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, encodeFunctionData, erc20Abi, formatUnits, parseEther, parseEventLogs, parseUnits } from 'viem';
import { vBNBAbi } from '../abis/vBNBAbi';
import { vTokenAbi } from '../abis/vTokenAbi';
import { validateAndGetTokenDetails, validateWallet } from '../utils';

interface Props {
	chainName: string;
	account: Address;
	amount: string;
	tokenSymbol: string;
	pool: string;
}
const { checkToApprove } = EVM.utils;
/**
 * Mints vTokens by depositing/supplying assets to the Venus Protocol.
 *
 * @param props - Parameters for minting vTokens
 * @param options - System tools containing provider, transaction sender, and notification functions
 * @returns Result object with transaction status and details of minted vTokens
 */
export async function mintToken({ chainName, account, amount, tokenSymbol, pool }: Props, options: FunctionOptions): Promise<FunctionReturn> {
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
	const tokenDetails = validateAndGetTokenDetails({ chainName, pool, tokenSymbol: tokenSymbol });
	if (!tokenDetails.success) {
		return toResult(tokenDetails.errorMessage, true);
	}

	const provider = getProvider(tokenDetails.data.chainId);
	const vToken = await provider.multicall({
		contracts: ['symbol', 'decimals'].map((functionName) => ({
			address: tokenDetails.data.tokenAddress,
			abi: erc20Abi,
			functionName,
		})),
	});

	const [symbol_vToken, decimals_vToken] = vToken.map((result) => result.result) as [string, bigint];
	if (!symbol_vToken || !decimals_vToken)
		throw new Error(
			`Invalid ERC20 token contract at address ${tokenDetails.data.tokenAddress}. Failed to fetch token details (symbol: ${symbol_vToken}, decimals: ${decimals_vToken})`,
		);

	try {
		await notify('Preparing to mint Token...');
		const transactions: EVM.types.TransactionParams[] = [];

		// Prepare mint transaction
		if (tokenDetails.data.isChainBased) {
			const mintTx: EVM.types.TransactionParams = {
				target: tokenDetails.data.tokenAddress,
				data: encodeFunctionData({
					abi: vBNBAbi,
					functionName: 'mint',
					args: [],
				}),
				value: parseEther(amount),
			};
			transactions.push(mintTx);
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

			// console.log(underlyingAssetAddress);
			await checkToApprove({
				args: {
					account,
					target: underlyingAssetAddress,
					spender: tokenDetails.data.tokenAddress,
					amount: parseUnits(amount, Number(decimals_uToken)),
				},
				provider,
				transactions,
			});
			const mintTx: EVM.types.TransactionParams = {
				target: tokenDetails.data.tokenAddress,
				data: encodeFunctionData({
					abi: vTokenAbi,
					functionName: 'mint',
					args: [parseUnits(amount, Number(decimals_uToken))],
				}),
			};
			transactions.push(mintTx);
		}
		// console.log("transactions", transactions);

		// Send transactions (to mint)
		const result = await sendTransactions({
			chainId: tokenDetails.data.chainId,
			account,
			transactions: transactions,
		});

		const mintData = result.data[result.data.length - 1];
		if (result.isMultisig) {
			return toResult(mintData.message);
		}
		// Extract and verify transaction hash
		const txHash = mintData.hash;
		if (!txHash) return toResult('Transaction succeeded, but failed to receive tx hash', true);

		// Get transaction receipt and parse Deposit event
		const receipt = await provider.getTransactionReceipt({ hash: txHash });
		// console.log("receipt.logs", receipt.logs );

		// Look for Mint event specifically
		const mintLogs = parseEventLogs({
			abi: tokenDetails.data.isChainBased ? vBNBAbi : vTokenAbi,
			eventName: 'Mint',
			logs: receipt.logs,
		});

		if (mintLogs.length === 0) {
			return toResult(`Transaction succeeded but no Mint event found.  ${JSON.stringify(mintData)}`, true);
		}
		const { mintTokens } = mintLogs[0].args;
		const totalSupplyText = tokenDetails.data.isChainBased
			? ''
			: `Total ${formatUnits((mintLogs[0].args as { totalSupply: bigint }).totalSupply, Number(decimals_vToken))} ${symbol_vToken}.`;

		return toResult(
			`Successfully deposited ${amount} ${tokenSymbol}. Minted ${formatUnits(mintTokens, Number(decimals_vToken))} ${symbol_vToken}. ${totalSupplyText} ${JSON.stringify(mintData)}`,
		);
	} catch (error) {
		return toResult(`Failed to mint token: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
	}
}
