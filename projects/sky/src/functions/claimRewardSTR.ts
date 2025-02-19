import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import { strAbi } from '../abis';
import { STR_ADDRESS, supportedChains } from '../constants';

interface Props {
	chainName: string;
	account: Address;
}

const { getChainFromName } = EVM.utils;

export async function claimRewardSTR({ chainName, account }: Props, { notify, evm: { getProvider, sendTransactions } }: FunctionOptions): Promise<FunctionReturn> {
	if (!account) return toResult('Wallet not connected', true);

	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Sky protocol is not supported on ${chainName}`, true);

	await notify('Checking pending rewards...');

	// Check pending rewards
	const publicClient = getProvider(chainId);
	const pendingReward = await publicClient.readContract({
		address: STR_ADDRESS,
		abi: strAbi,
		functionName: 'earned',
		args: [account],
	});

	if (pendingReward === 0n) {
		return toResult('No rewards to claim', true);
	}

	await notify('Preparing claim transaction...');

	const tx: EVM.types.TransactionParams = {
		target: STR_ADDRESS,
		data: encodeFunctionData({
			abi: strAbi,
			functionName: 'getReward',
			args: [],
		}),
	};

	await notify('Waiting for transaction confirmation...');

	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const claimMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? claimMessage.message : `Successfully claimed SKY rewards. ${claimMessage.message}`);
}
