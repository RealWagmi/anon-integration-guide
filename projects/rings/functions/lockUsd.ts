import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
    checkToApprove
} from '@heyanon/sdk';
import { STKSCUSD_SONIC_ADDRESS, supportedChains, VEUSD_SONIC_ADDRESS } from '../constants';
import { veUsdAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
	amount: string;
	weeks: number;
}

/**
 * Locks stkscUSD in the Rings protocol for the opportunity to vote.
 * @param props - The lock parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns ERC-721 token ID.
 */
export async function lockUsd(
	{ chainName, account, amount, weeks }: Props,
	{ sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
	// Check wallet connection
	if (!account) return toResult('Wallet not connected', true);

    await notify('Checking everything...');

	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) return toResult(`Rings is not supported on ${chainName}`, true);

    // Validate amount
    const provider = getProvider(chainId);
    const amountWithDecimals = parseUnits(amount, 6);
    if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
    const balance = await provider.readContract({
        address: STKSCUSD_SONIC_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    })
    if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);

	// Validate lock duration
	if (weeks < 1 || weeks > 104) return toResult('Lock duration must be between 1 and 104 weeks', true);

    await notify('Locking stkscUSD...');

    const transactions: TransactionParams[] = [];

    // Approve the asset beforehand
    await checkToApprove({
        args: {
            account,
            target: STKSCUSD_SONIC_ADDRESS,
            spender: VEUSD_SONIC_ADDRESS,
            amount: amountWithDecimals
        },
        transactions,
        provider,
    });
    
	// Prepare lock transaction
	const lockDuration = weeks * 7 * 24 * 60 * 60;
	const tx: TransactionParams = {
			target: VEUSD_SONIC_ADDRESS,
			data: encodeFunctionData({
					abi: veUsdAbi,
					functionName: 'create_lock',
					args: [amountWithDecimals, lockDuration],
			}),
	};
	transactions.push(tx);

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions });
	const lockMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? lockMessage.message : `Successfully locked stkscUSD for ${weeks} weeks. Your NFT ID is ${lockMessage.message}`);
}