import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import { vBNBAbi } from '../abis/vBNBAbi';

import { supportedChains } from '../constants';
import { validateAndGetTokenDetails, validateWallet } from '../utils';
const { getChainFromName } = EVM.utils;
interface Props {
	chainName: string;
	account: Address;
	tokenSymbol: string;
	pool: string;
}

/**
 * Updates the exchange rate and borrow balance for a token in the Venus protocol.
 *
 * @returns {Promise<FunctionReturn>} - The result of the update operations.
 */
export async function updateToken({ chainName, account, tokenSymbol, pool }: Props, options: FunctionOptions): Promise<FunctionReturn> {
	const {
		evm: { sendTransactions },
		notify,
	} = options;
	const wallet = validateWallet({ account });
	if (!wallet.success) {
		return toResult(wallet.errorMessage, true);
	}
	// Validate chain
	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	const tokenDetails = validateAndGetTokenDetails({ chainName, pool, tokenSymbol: tokenSymbol });
	if (!tokenDetails.success) {
		return toResult(tokenDetails.errorMessage, true);
	}
	if (supportedChains.indexOf(chainId) === -1) return toResult(`Protocol is not supported on ${chainName}`, true);

	try {
		await notify('Preparing transactions for updates...');
		const exchangeRateCurrent: EVM.types.TransactionParams = {
			target: tokenDetails.data.tokenAddress,
			data: encodeFunctionData({
				abi: vBNBAbi, /// same as vToken abi
				functionName: 'exchangeRateCurrent',
				args: [],
			}),
		};

		const borrowBalanceCurrent: EVM.types.TransactionParams = {
			target: tokenDetails.data.tokenAddress,
			data: encodeFunctionData({
				abi: vBNBAbi,
				functionName: 'borrowBalanceCurrent',
				args: [wallet.data.account],
			}),
		};

		// Send both transactions
		const result = await sendTransactions({
			chainId: tokenDetails.data.chainId,
			account,
			transactions: [exchangeRateCurrent, borrowBalanceCurrent],
		});

		const updateData = result.data[result.data.length - 1];

		return toResult(
			result.isMultisig ? updateData.message : `Successfully updated exchange rate and borrow balance for ${tokenSymbol} in ${pool} pool. ${JSON.stringify(updateData)}`,
		);
	} catch (error) {
		return toResult(`Failed to update token state: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
	}
}
