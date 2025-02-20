import { EVM, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import { vComptrollerAbi } from '../abis/vComptrollerAbi';
import { validateAndGetTokenDetails, validateWallet } from '../utils';

interface Props {
	chainName: string;
	account: Address;
	tokenSymbol: string;
	pool: string;
}

/**
 * Exit market Venus protocol.
 *
 * @param props - Exit market parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns result containing the transaction hash.
 */
export async function exitMarket({ chainName, account, tokenSymbol, pool }: Props, options: FunctionOptions): Promise<FunctionReturn> {
	const {
		evm: { sendTransactions },
		notify,
	} = options;
	const wallet = validateWallet({ account });
	if (!wallet.success) {
		return toResult(wallet.errorMessage, true);
	}
	// Validate chain
	const tokenDetails = validateAndGetTokenDetails({ chainName, pool, tokenSymbol: tokenSymbol });
	if (!tokenDetails.success) {
		return toResult(tokenDetails.errorMessage, true);
	}

	try {
		await notify('Preparing to exit Market...');
		// Prepare transaction
		const exitMarketTx: EVM.types.TransactionParams = {
			target: tokenDetails.data.comptroller,
			data: encodeFunctionData({
				abi: vComptrollerAbi,
				functionName: 'exitMarket',
				args: [tokenDetails.data.tokenAddress],
			}),
		};
		// Send transactions
		const result = await sendTransactions({
			chainId: tokenDetails.data.chainId,
			account,
			transactions: [exitMarketTx],
		});
		const exitData = result.data[result.data.length - 1];
		return toResult(
			result.isMultisig
				? exitData.message
				: `Successfully exited Market. You disabled ${tokenSymbol} in venus ${pool} pool as collateral. Your borrow limit are decreased ${JSON.stringify(exitData)}`,
		);
	} catch (error) {
		return toResult(`Failed to exit market: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
	}
}
