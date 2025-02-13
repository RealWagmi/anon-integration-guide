import { Address, encodeFunctionData } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
} from '@heyanon/sdk';
import { supportedChains, TOKEN } from '../constants';
import { rewardpoolAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
}

/**
 * Withdraw locked protocol's token DEEPR.
 * @param props - The withdraw parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function withdrawLockedDeepr(
	{ chainName, account }: Props,
	{ sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Deepr Finance is not supported on ${chainName}`, true);

    const provider = getProvider(chainId);

	const timelockSeconds = await provider.readContract({
        address: TOKEN.CONTRACT.REWARDPOOL as Address,
        abi: rewardpoolAbi,
        functionName: 'timelockInterval',
    }) as bigint;

    // Validate unstaking request
    const [, , , isRequestStarted, requestTimestamp] = await provider.readContract({
        address: TOKEN.CONTRACT.REWARDPOOL as Address,
        abi: rewardpoolAbi,
        functionName: 'userInfo',
        args: [account],
    }) as [bigint, bigint, bigint, boolean, bigint];
    if (!isRequestStarted || requestTimestamp + timelockSeconds < Math.ceil(Date.now() / 1000)) {
		return toResult(`You either have already withdrew tokens or timelock has not been surpassed yet`, true);
	}

	await notify('Withdrawing DEEPR...');

	// Prepare withdraw transaction
	const tx: TransactionParams = {
			target: TOKEN.CONTRACT.REWARDPOOL as Address,
			data: encodeFunctionData({
					abi: rewardpoolAbi,
					functionName: 'withdrawLockedTokens',
			}),
	};

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const withdrawMessage = result.data[result.data.length - 1];

	return toResult(
        result.isMultisig ? 
        withdrawMessage.message : 
        `Successfully withdrew DEEPR.`
    );
}