import { Address, encodeFunctionData, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains, BORROWABLE_WS_DEPOSIT_ADDRESS } from '../constants';
import { siloAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    amount: string;
}

/**
 * Borrow wS token from Silo Finance
 * @param {Props} { chainName, account, amount }
 * @param {FunctionOptions} { sendTransactions, getProvider, notify }
 * @returns Transaction result
 */
export async function borrowWS({ chainName, account, amount }: Props, { sendTransactions, getProvider, notify }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Silo protocol is not supported on ${chainName}`, true);

    const amountInWei = parseUnits(amount, 18);
    if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

    const publicClient = getProvider(chainId);

    const maxBorrow = (await publicClient.readContract({
        address: BORROWABLE_WS_DEPOSIT_ADDRESS,
        abi: siloAbi,
        functionName: 'maxBorrow',
        args: [account],
    })) as bigint;
    if (maxBorrow < amountInWei) {
        return toResult(`Insufficient borrow amount. Have ${maxBorrow}, want to borrow: ${amount}`, true);
    }

    await notify('Preparing to borrow wS token from Silo Finance...');

    const transactions: TransactionParams[] = [];

    // Prepare borrow transaction
    const tx: TransactionParams = {
        target: BORROWABLE_WS_DEPOSIT_ADDRESS,
        data: encodeFunctionData({
            abi: siloAbi,
            functionName: 'borrow',
            args: [amount, account, account],
        }),
    };
    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const depositMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? depositMessage.message : `Successfully borrow ${amount} wS from Silo Finance. ${depositMessage.message}`);
}
