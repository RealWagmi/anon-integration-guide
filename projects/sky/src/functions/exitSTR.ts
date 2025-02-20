import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import { strAbi } from '../abis';
import { STR_ADDRESS, supportedChains } from '../constants';

interface Props {
	chainName: string;
	account: Address;
}

const { getChainFromName } = EVM.utils;

export async function exitSTR({ chainName, account }: Props, { notify, evm: { sendTransactions, getProvider } }: FunctionOptions): Promise<FunctionReturn> {
	if (!account) return toResult('Wallet not connected', true);

	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Sky protocol is not supported on ${chainName}`, true);

	await notify('Checking staked balance...');

	// Check if user has staked balance
	const publicClient = getProvider(chainId);

	// Check if user has any staked tokens
	const stakedBalance = await publicClient.readContract({
		address: STR_ADDRESS,
		abi: strAbi,
		functionName: 'balanceOf',
		args: [account],
	});

	if (stakedBalance === 0n) {
		return toResult('No staked balance to withdraw', true);
	}

	await notify('Preparing exit transaction (withdraw all + claim rewards)...');

	const tx: EVM.types.TransactionParams = {
		target: STR_ADDRESS,
		data: encodeFunctionData({
			abi: strAbi,
			functionName: 'exit',
			args: [],
		}),
	};

	await notify('Waiting for transaction confirmation...');

	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const exitMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? exitMessage.message : `Successfully exited from STR (withdrawn all + claimed rewards). ${exitMessage.message}`);
}
