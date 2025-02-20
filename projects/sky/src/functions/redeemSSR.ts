import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address, encodeFunctionData, formatUnits, parseUnits } from 'viem';
import { ssrAbi } from '../abis';
import { SSR_ADDRESS, supportedChains } from '../constants';

interface Props {
	chainName: string;
	account: Address;
	shares: string;
}

const { getChainFromName } = EVM.utils;

export async function redeemSSR({ chainName, account, shares }: Props, { evm: { sendTransactions, getProvider } }: FunctionOptions): Promise<FunctionReturn> {
	if (!account) return toResult('Wallet not connected', true);

	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Sky protocol is not supported on ${chainName}`, true);

	const publicClient = getProvider(chainId);

	const sharesInWei = parseUnits(shares, 18);
	if (sharesInWei === 0n) return toResult('Amount must be greater than 0', true);

	// Check max redeemable amount
	const maxRedeem = await publicClient.readContract({
		address: SSR_ADDRESS,
		abi: ssrAbi,
		functionName: 'maxRedeem',
		args: [account],
	});

	if (sharesInWei > maxRedeem) {
		return toResult(`Cannot redeem more than ${formatUnits(maxRedeem, 18)} sUSDS`, true);
	}

	const transactions: EVM.types.TransactionParams[] = [
		{
			target: SSR_ADDRESS,
			data: encodeFunctionData({
				abi: ssrAbi,
				functionName: 'redeem',
				args: [sharesInWei, account, account],
			}),
		},
	];

	const result = await sendTransactions({ chainId, account, transactions });
	const redeemMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? redeemMessage.message : `Successfully redeemed ${shares} sUSDS. ${redeemMessage.message}`);
}
