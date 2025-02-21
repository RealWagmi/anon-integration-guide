import { EVM, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
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

/**
 * Redeem Token using Venus protocol.
 *
 * @param props - redeem parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Redeem result containing the transaction hash.
 */
export async function redeemUnderlying({ chainName, account, amount, tokenSymbol, pool }: Props, options: FunctionOptions): Promise<FunctionReturn> {
	const {
		evm: { sendTransactions, getProvider },
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
	let symbol_uToken = tokenDetails.data.isChainBased ? 'BNB' : '';
	let decimals_uToken: bigint = tokenDetails.data.isChainBased ? 18n : 0n;
	if (!tokenDetails.data.isChainBased) {
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

		[symbol_uToken, decimals_uToken] = uToken.map((result) => result.result) as [string, bigint];
		if (!symbol_uToken || !decimals_uToken)
			throw new Error(
				`Invalid ERC20 token contract at address ${tokenDetails.data.tokenAddress}. Failed to fetch token details (symbol: ${symbol_uToken}, decimals: ${decimals_uToken})`,
			);
	}
	try {
		await notify('Preparing to redeem Token...');

		// Prepare redeem deposited transaction
		const redeemTx: EVM.types.TransactionParams = {
			target: tokenDetails.data.tokenAddress,
			data: encodeFunctionData({
				abi: vBNBAbi, // redeemUnderlying abi match  vBNBAbi and vTokenAbi
				functionName: 'redeemUnderlying',
				args: [parseUnits(amount, Number(decimals_uToken))], // Convert to Wei
			}),
		};
		// Send transactions (to redeem)
		const result = await sendTransactions({
			chainId: tokenDetails.data.chainId,
			account,
			transactions: [redeemTx],
		});
		const redeemData = result.data[result.data.length - 1];
		return toResult(result.isMultisig ? redeemData.message : `Successfully redeemed ${amount} ${symbol_uToken}. ${JSON.stringify(redeemData)}`);
	} catch (error) {
		return toResult(`Failed to redeem token: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
	}
}
