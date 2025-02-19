import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, EVM, EvmChain } from '@heyanon/sdk';
import { CONTRACT, supportedChains } from '../constants';
import { rewardpoolAbi } from '../abis';
const { getChainFromName } = EVM.utils;

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
export async function withdrawLockedDeepr({ chainName, account }: Props, options: FunctionOptions): Promise<FunctionReturn> {
	const {
		evm: { getProvider, sendTransactions },
		notify,
	} = options;

	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName as EvmChain);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Deepr Finance is not supported on ${chainName}`, true);

    const provider = getProvider(chainId);

	const timelockSeconds = await provider.readContract({
        address: CONTRACT.REWARDPOOL,
        abi: rewardpoolAbi,
        functionName: 'timelockInterval',
    }) as bigint;

    // Validate unstaking request
    const [, , , isRequestStarted, requestTimestamp] = await provider.readContract({
        address: CONTRACT.REWARDPOOL,
        abi: rewardpoolAbi,
        functionName: 'userInfo',
        args: [account],
    }) as [bigint, bigint, bigint, boolean, bigint];
    if (!isRequestStarted || requestTimestamp + timelockSeconds < Math.ceil(Date.now() / 1000)) {
		return toResult(`You either have already withdrew tokens or timelock has not been surpassed yet`, true);
	}

	await notify('Withdrawing DEEPR...');

	// Prepare withdraw transaction
	const tx: EVM.types.TransactionParams = {
			target: CONTRACT.REWARDPOOL,
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