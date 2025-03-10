import { EVM, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, encodeFunctionData, formatUnits, parseUnits } from 'viem';
import { vBNBAbi } from '../abis/vBNBAbi';
import { vComptrollerAbi } from '../abis/vComptrollerAbi';
import { vOrcaleABI } from '../abis/vOracleABI';
import { ORACLE_ADDRESS } from '../constants';
import { validateAndGetTokenDetails, validateWallet } from '../utils';

interface Props {
	chainName: string;
	account: Address;
	amount: string;
	tokenSymbol: string;
	pool: string;
}

/**
 * Borrows Token using Venus protocol.
 *
 * @param props - Borrow parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Borrow result containing the transaction hash.
 */
export async function borrow({ chainName, account, amount, tokenSymbol, pool }: Props, options: FunctionOptions): Promise<FunctionReturn> {
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
	// Validate chain
	const tokenDetails = validateAndGetTokenDetails({ chainName, pool, tokenSymbol: tokenSymbol });
	if (!tokenDetails.success) {
		return toResult(tokenDetails.errorMessage, true);
	}
	const provider = getProvider(tokenDetails.data.chainId);
	try {
		await notify('Checking the borrow limit of the account...');

		const result = (await provider.readContract({
			abi: vComptrollerAbi,
			address: tokenDetails.data.comptroller,
			functionName: 'getAccountLiquidity',
			args: [account],
		})) as [bigint, bigint];
		const [, liquidity] = result;
		//Always 18
		const borrowLimitInUSD = parseFloat(formatUnits(liquidity, 18));
		if (borrowLimitInUSD <= 0) {
			return toResult('No available liquidity to borrow. Please supply a collateral', true);
		}
		// console.log("tokenDetails.data.tokenAddress", tokenDetails.data.tokenAddress);
		// Handling of chain based tokens.
		const oracleAddress = ORACLE_ADDRESS[tokenDetails.data.chainId];
		if (!oracleAddress) {
			return toResult(`Oracle not configured for chain ${tokenDetails.data.chainId}`, true);
		}

		const tokenPriceInUSD = (await provider.readContract({
			abi: vOrcaleABI,
			address: oracleAddress,
			functionName: 'getUnderlyingPrice',
			args: [tokenDetails.data.tokenAddress],
		})) as bigint;

		if (borrowLimitInUSD < parseFloat(formatUnits(tokenPriceInUSD!, 18)) * parseFloat(amount)) {
			return toResult('Not enough borrow limit please supply more', true);
		}

		await notify('Preparing to borrow Token...');
		// Prepare borrow transaction
		const borrowTx: EVM.types.TransactionParams = {
			target: tokenDetails.data.tokenAddress,
			data: encodeFunctionData({
				abi: vBNBAbi,
				functionName: 'borrow',
				args: [parseUnits(amount, 18)],
			}),
		};
		// Send transactions (enter borrow)
		const txResult = await sendTransactions({
			chainId: tokenDetails.data.chainId,
			account,
			transactions: [borrowTx],
		});
		const borrowData = txResult.data[txResult.data.length - 1];
		return toResult(txResult.isMultisig ? borrowData.message : `Successfully borrowed ${amount} ${tokenSymbol}. ${JSON.stringify(borrowData)}`);
	} catch (error) {
		return toResult(`Failed to borrow token: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
	}
}
