import { Address, encodeFunctionData, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName, checkToApprove } from '@heyanon/sdk';
import { supportedChains, SSR_ADDRESS, USDS_ADDRESS } from '../constants';
import { ssrAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    amount: string;
    referral?: number;
}

export async function depositSSR({ chainName, account, amount }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Sky protocol is not supported on ${chainName}`, true);

    await notify('Preparing to deposit USDS tokens to Sky Savings Rate...');

    const amountInWei = parseUnits(amount, 18);
    if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

    const provider = getProvider(chainId);

    const transactions: TransactionParams[] = [];

    // Check and prepare approve transaction if needed
    await checkToApprove({
        args: {
            account,
            target: USDS_ADDRESS,
            spender: SSR_ADDRESS,
            amount: amountInWei,
        },
        provider,
        transactions
    });

    // Prepare deposit transaction
    const tx: TransactionParams = {
        target: SSR_ADDRESS,
        data: encodeFunctionData({
            abi: ssrAbi,
            functionName: 'deposit',
            args: [amountInWei, account],
        }),
    };
    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const depositMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? depositMessage.message : `Successfully deposited ${amount} USDS to SSR. ${depositMessage.message}`);
}
