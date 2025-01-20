import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
} from '@heyanon/sdk';
import { supportedChains, VEETH_SONIC_ADDRESS } from '../constants';
import { veEthAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
	delegatee: Address;
}

/**
 * Delegates all voting power of veETH to delegatee.
 * @param props - The delegate parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function delegateVotesEth(
	{ chainName, account, delegatee }: Props,
	{ sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Rings is not supported on ${chainName}`, true);

    await notify('Delegating votes...');
    
	// Prepare delegate transaction
	const tx: TransactionParams = {
			target: VEETH_SONIC_ADDRESS,
			data: encodeFunctionData({
					abi: veEthAbi,
					functionName: 'delegate',
					args: [delegatee],
			}),
	};

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const transferMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? transferMessage.message : `Successfully delegated votes to ${delegatee}.`);
}