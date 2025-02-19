import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, encodeFunctionData, formatUnits, parseUnits } from 'viem';
import { erc20Abi } from 'viem';
import { ssrAbi } from '../abis';
import { SSR_ADDRESS, SUSDS_ADDRESS, supportedChains } from '../constants';

interface Props {
	chainName: string;
	account: Address;
	amount: string;
}

const { getChainFromName } = EVM.utils;

export async function withdrawSSR({ chainName, account, amount }: Props, { notify, evm: { getProvider, sendTransactions } }: FunctionOptions): Promise<FunctionReturn> {
	if (!account) return toResult('Wallet not connected', true);

	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Sky protocol is not supported on ${chainName}`, true);

	await notify('Preparing to withdraw USDS tokens from Sky Savings Rate...');

	const amountInWei = parseUnits(amount, 18);
	if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

	const provider = getProvider(chainId);
	const sUSdsBalance = await provider.readContract({ abi: erc20Abi, address: SUSDS_ADDRESS, functionName: 'balanceOf', args: [account] });

	if (sUSdsBalance < amountInWei) {
		return toResult(`Insufficient sUSDS balance. Have ${formatUnits(sUSdsBalance, 18)}, want to withdraw ${amount}`, true);
	}

	const tx: EVM.types.TransactionParams = {
		target: SSR_ADDRESS,
		data: encodeFunctionData({
			abi: ssrAbi,
			functionName: 'withdraw',
			args: [amountInWei, account, account],
		}),
	};

	await notify('Waiting for transaction confirmation...');

	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const withdrawMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? withdrawMessage.message : `Successfully withdrawn ${amount} USDS from SSR. ${withdrawMessage.message}`);
}
