import { Address, encodeFunctionData } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
} from '@heyanon/sdk';
import { supportedChains, ADDRESS } from '../constants';
import { rewardpoolAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
}

/**
 * Request to unstake protocol's token DEEPR.
 * @param props - The request parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function requestUnstakeDeepr(
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
        address: ADDRESS.CONTRACT.REWARDPOOL as Address,
        abi: rewardpoolAbi,
        functionName: 'timelockInterval',
    }) as number;
	const timelockDays = timelockSeconds / (60 * 60 * 24);

	await notify(`Please, note that withdrawal requires a ${timelockDays}-day cooling period.`)

    // Validate staking
    const [stakedAmount, , , isRequestStarted, ] = await provider.readContract({
        address: ADDRESS.CONTRACT.REWARDPOOL as Address,
        abi: rewardpoolAbi,
        functionName: 'userInfo',
        args: [account],
    }) as [bigint, bigint, bigint, boolean, bigint];
    if (stakedAmount === 0n || !isRequestStarted) return toResult(`You either have already requested unstake or didn't stake`, true);

	await notify('Unstaking DEEPR...');

	// Prepare unstake transaction
	const tx: TransactionParams = {
			target: ADDRESS.CONTRACT.REWARDPOOL as Address,
			data: encodeFunctionData({
					abi: rewardpoolAbi,
					functionName: 'withdrawRequestAndHarvest',
			}),
	};

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const unstakeMessage = result.data[result.data.length - 1];

	return toResult(
        result.isMultisig ? 
        unstakeMessage.message : 
        `Your DEEPR will be unlocked in ${timelockDays} days. Please comeback later to withdraw locked tokens.`
    );
}