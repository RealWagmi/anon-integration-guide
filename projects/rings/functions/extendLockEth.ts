import { Address, encodeFunctionData } from 'viem';
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
	weeks: number;
}

/**
 * Increases locked stkscETH duration in the Rings protocol.
 * @param props - The extension parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function extendLockEth(
	{ chainName, account, weeks }: Props,
	{ sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Rings is not supported on ${chainName}`, true);

	// Validate lock duration
	if (weeks < 1 || weeks > 104) return toResult('Lock duration must be between 1 and 104 weeks', true);

    await notify('Locking more stkscETH...');
    
	// Prepare extension transaction
    const provider = getProvider(chainId);
    const tokenId = await provider.readContract({
        address: VEETH_SONIC_ADDRESS,
        abi: veEthAbi,
        functionName: 'tokenOfOwnerByIndex',
        args: [account, 0],
    })
    if (tokenId === 0) return toResult('No locked stkscETH', true);

    const lockDuration = weeks * 7 * 24 * 60 * 60;
	const tx: TransactionParams = {
			target: VEETH_SONIC_ADDRESS,
			data: encodeFunctionData({
					abi: veEthAbi,
					functionName: 'increase_unlock_time',
					args: [tokenId, lockDuration],
			}),
	};

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const lockMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? lockMessage.message : `Successfully extended stkscETH lock.`);
}