import { Address, encodeFunctionData, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { EQUAL_ADDRESS, supportedChains, VE_EQUAL_ADDRESS } from '../constants';

import { checkToApprove } from '@heyanon/sdk';
import { veNftAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    amount: string;
    secondsToExpire: number;
}

/**
 * Creates a new lock of tokens in the veToken contract.
 * @param props - The lock parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Transaction result.
 */
export async function createLock({ chainName, account, amount, secondsToExpire }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    // we can safely assume it's 18 decimals since it'll always be EQUAL that is being locked
    const amountBn = parseUnits(amount, 18);
    if (amountBn <= 0n) return toResult('Amount must be greater than 0', true);
    if (secondsToExpire <= 0) return toResult('Lock duration must be greater than 0', true);

    await notify('Preparing to create lock...');

    const provider = getProvider(chainId);
    const transactions: TransactionParams[] = [];

    // Check and prepare approve transaction if needed
    await checkToApprove({
        args: {
            account,
            target: EQUAL_ADDRESS,
            spender: VE_EQUAL_ADDRESS,
            amount: amountBn,
        },
        provider,
        transactions,
    });

    const lockTx: TransactionParams = {
        target: VE_EQUAL_ADDRESS,
        data: encodeFunctionData({
            abi: veNftAbi,
            functionName: 'create_lock',
            args: [amountBn, secondsToExpire],
        }),
    };
    transactions.push(lockTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const lockMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? lockMessage.message : `Successfully created lock for ${amount} tokens. ${lockMessage.message}`);
}
