import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { bribeAbi } from '../abis/bribeAbi';

interface Props {
    chainName: string;
    account: Address;
    bribeAddress: Address;
    tokenAddress: Address;
    amount: string;
}

export async function submitBribe({ chainName, account, bribeAddress, tokenAddress, amount }: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    if (!bribeAddress) return toResult('Bribe address is required', true);
    if (!tokenAddress) return toResult('Token address is required', true);

    const amountBn = BigInt(amount);
    if (amountBn <= 0n) return toResult('Amount must be greater than 0', true);

    await notify('Preparing to submit bribe...');

    const transactions: TransactionParams[] = [];

    const bribeTx: TransactionParams = {
        target: bribeAddress,
        data: encodeFunctionData({
            abi: bribeAbi,
            functionName: 'notifyRewardAmount',
            args: [tokenAddress, amountBn],
        }),
    };
    transactions.push(bribeTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const bribeMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? bribeMessage.message : `Successfully submitted bribe. ${bribeMessage.message}`);
}
