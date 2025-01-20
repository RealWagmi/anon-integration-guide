import { Address, encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import {
	FunctionReturn,
	FunctionOptions,
	TransactionParams,
	toResult,
	getChainFromName,
    checkToApprove
} from '@heyanon/sdk';
import { SCUSD_SONIC_ADDRESS, SCUSD_SONIC_WITHDRAW_ADDRESS, supportedChains, USDC_ADDRESS } from '../constants';
import { scUsdWithdrawQueueAbi } from '../abis';

interface Props {
	chainName: string;
	account: Address;
	amount: string;
}

/**
 * Redeems USDC from the Rings protocol in exchange for scUSD.
 * @param props - The redeem parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Request ID.
 */
export async function redeemUsdc(
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
        address: SCUSD_SONIC_ADDRESS,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [account],
    })
    if (balance < amountWithDecimals) return toResult('Amount exceeds your balance', true);

    await notify('Sending request to redeem USDC...');

    const transactions: TransactionParams[] = [];

    // Approve the asset beforehand
    await checkToApprove({
        args: {
            account,
            target: SCUSD_SONIC_ADDRESS,
            spender: SCUSD_SONIC_WITHDRAW_ADDRESS,
            amount: amountWithDecimals
        },
        transactions,
        provider,
    });
    
	// Prepare redeem transaction
	const discount = 1;
	const secondsToDeadline = 432000;
	const tx: TransactionParams = {
			target: SCUSD_SONIC_WITHDRAW_ADDRESS,
			data: encodeFunctionData({
					abi: scUsdWithdrawQueueAbi,
					functionName: 'requestOnChainWithdraw',
					args: [USDC_ADDRESS, amountWithDecimals, discount, secondsToDeadline],
			}),
	};
	transactions.push(tx);

	// Sign and send transaction
	const result = await sendTransactions({ chainId, account, transactions });
	const redeemMessage = result.data[result.data.length - 1];

	return toResult(result.isMultisig ? redeemMessage.message : `Successfully requested redeem for USDC. USDC will be deposited in 5 days.`);
}