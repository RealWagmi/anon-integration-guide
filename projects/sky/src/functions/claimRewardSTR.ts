import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { encodeFunctionData } from 'viem';
import { strAbi } from '../abis';
import { STR_ADDRESS, supportedChains } from '../constants';

interface Props {
	chainName: string;
}

const { getChainFromName } = EVM.utils;

export async function claimRewardSTR({ chainName }: Props, options: FunctionOptions): Promise<FunctionReturn> {
	// Check wallet connection
	const account = await options.evm.getAddress();
	const {
		notify,
		evm: { getProvider, sendTransactions },
	} = options;

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

	return toResult(`Successfully claimed SKY rewards. ${claimMessage.message}`);
}
