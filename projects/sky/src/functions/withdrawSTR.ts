import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, encodeFunctionData, formatUnits, parseUnits } from 'viem';
import { strAbi } from '../abis';
import { STR_ADDRESS, supportedChains } from '../constants';

interface Props {
	chainName: string;
	account: Address;
	amount: string;
}

const { getChainFromName } = EVM.utils;

export async function withdrawSTR({ chainName, account, amount }: Props, { notify, evm: { getProvider, sendTransactions } }: FunctionOptions): Promise<FunctionReturn> {
	if (!account) return toResult('Wallet not connected', true);

	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Sky protocol is not supported on ${chainName}`, true);

	await notify('Preparing to withdraw USDS tokens from Sky Token Rewards...');

	const amountInWei = parseUnits(amount, 18);
	if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

	// Check user's staked balance
	const publicClient = getProvider(chainId);
	const stakedBalance = await publicClient.readContract({
		address: STR_ADDRESS,
		abi: strAbi,
		functionName: 'balanceOf',
		args: [account],
	});

	if (stakedBalance < amountInWei) {
		return toResult(`Insufficient staked balance. Have ${formatUnits(stakedBalance, 18)}, want to withdraw ${amount}`, true);
	}

	await notify('Preparing withdrawal transaction...');

	const tx: EVM.types.TransactionParams = {
		target: STR_ADDRESS,
		data: encodeFunctionData({
			abi: strAbi,
			functionName: 'withdraw',
			args: [amountInWei],
		}),
	};

	await notify('Waiting for transaction confirmation...');

	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const withdrawMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? withdrawMessage.message : `Successfully withdrawn ${amount} USDS from STR. ${withdrawMessage.message}`);
}
