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
}

/**
 * Increases locked stkscUSD in the Rings protocol.
 * @param props - The lock parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Success message.
 */
export async function increaseLockedStkscUsd(
	{ chainName, account, amount }: Props,
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

    await notify('Locking more stkscUSD...');

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
					functionName: 'increase_amount',
					args: [tokenId, amountWithDecimals],
			}),
	};
	transactions.push(tx);

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions });
	const lockMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? lockMessage.message : `Successfully locked ${amount} stkscUSD.`);
}