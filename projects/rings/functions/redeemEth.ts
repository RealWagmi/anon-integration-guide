import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
    checkToApprove
} from '@heyanon/sdk';
import { SCETH_SONIC_ADDRESS, SCETH_SONIC_WITHDRAW_ADDRESS, supportedChains, WETH_ADDRESS } from '../constants';
import { scEthWithdrawQueueAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
	amount: string;
}

/**
 * Redeems WETH from the Rings protocol in exchange for scETH.
 * @param props - The redeem parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Request ID.
 */
export async function redeemEth(
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
        address: SCETH_SONIC_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    })
    if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);

    await notify('Sending request to redeem WETH...');

    const transactions: TransactionParams[] = [];

    // Approve the asset beforehand
    await checkToApprove({
        args: {
            account,
            target: SCETH_SONIC_ADDRESS,
            spender: SCETH_SONIC_WITHDRAW_ADDRESS,
            amount: amountWithDecimals
        },
        transactions,
        provider,
    });
    
	// Prepare redeem transaction
	const discount = 1;
	const secondsToDeadline = 432000;
	const tx: TransactionParams = {
			target: SCETH_SONIC_WITHDRAW_ADDRESS,
			data: encodeFunctionData({
					abi: scEthWithdrawQueueAbi,
					functionName: 'requestOnChainWithdraw',
					args: [WETH_ADDRESS, amountWithDecimals, discount, secondsToDeadline],
			}),
	};
	transactions.push(tx);

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions });
	const redeemMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? redeemMessage.message : `Successfully requested redeem for WETH. WETH will be deposited in 5 days.`);
}