import { Address, encodeFunctionData } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
} from '@heyanon/sdk';
import { supportedChains, VEUSD_SONIC_ADDRESS } from '../constants';
import { veUsdAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
}

/**
 * Unlocks all stkscUSD from the Rings protocol.
 * @param props - The unlock parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function unlockStkscUsd(
	{ chainName, account }: Props,
	{ sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Rings is not supported on ${chainName}`, true);

    await notify('Unlocking stkscUSD...');
    
	// Prepare unlock transaction
    const provider = getProvider(chainId);
    const tokenId = await provider.readContract({
        address: VEUSD_SONIC_ADDRESS,
        abi: veUsdAbi,
        functionName: 'tokenOfOwnerByIndex',
        args: [account, 0],
    })
    if (tokenId === 0) return toResult('No locked stkscUSD', true);

	const tx: TransactionParams = {
			target: VEUSD_SONIC_ADDRESS,
			data: encodeFunctionData({
					abi: veUsdAbi,
					functionName: 'withdraw',
					args: [tokenId],
			}),
	};

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions: [tx] });
	const unlockMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? unlockMessage.message : `Successfully unlocked stkscUSD.`);
}