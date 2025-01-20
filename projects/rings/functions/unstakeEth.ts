import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
    checkToApprove
} from '@heyanon/sdk';
import { SCETH_SONIC_ADDRESS, STKSCETH_SONIC_ADDRESS, STKSCETH_SONIC_WITHDRAW_ADDRESS, supportedChains } from '../constants';
import { stkscEthWithdrawQueueAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
	amount: string;
}

/**
 * Unstakes scETH from the Rings protocol.
 * @param props - The unstake parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Request ID.
 */
export async function unstakeEth(
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
    const amountWithDecimals = parseUnits(amount, 18);
    if (amountWithDecimals === 0n) return toResult('Amount must be greater than 0', true);
    const balance = await provider.readContract({
        address: STKSCETH_SONIC_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    })
    if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);

    await notify('Sending request to unstake scETH...');

    const transactions: TransactionParams[] = [];

    // Approve the asset beforehand
    await checkToApprove({
        args: {
            account,
            target: STKSCETH_SONIC_ADDRESS,
            spender: STKSCETH_SONIC_WITHDRAW_ADDRESS,
            amount: amountWithDecimals
        },
        transactions,
        provider,
    });
    
	// Prepare unstake transaction
	const discount = 1;
	const secondsToDeadline = 432000;
	const tx: TransactionParams = {
			target: STKSCETH_SONIC_WITHDRAW_ADDRESS,
			data: encodeFunctionData({
					abi: stkscEthWithdrawQueueAbi,
					functionName: 'requestOnChainWithdraw',
					args: [SCETH_SONIC_ADDRESS, amountWithDecimals, discount, secondsToDeadline],
			}),
	};
	transactions.push(tx);

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions });
	const unstakeMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? unstakeMessage.message : `Successfully requested unstake for scETH. scETH will be deposited in 5 days.`);
}