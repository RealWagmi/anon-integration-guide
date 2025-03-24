import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { voterAbi } from '../abis/voterAbi';

interface Props {
    chainName: string;
    account: Address;
    voterAddress: Address;
    tokenId: string;
}

export async function reset({ chainName, account, voterAddress, tokenId }: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    if (!voterAddress) return toResult('Voter address is required', true);

    const tokenIdBn = BigInt(tokenId);

    await notify('Preparing to reset voter...');

    const transactions: TransactionParams[] = [];

    const resetTx: TransactionParams = {
        target: voterAddress,
        data: encodeFunctionData({
            abi: voterAbi,
            functionName: 'reset',
            args: [tokenIdBn],
        }),
    };
    transactions.push(resetTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const resetMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? resetMessage.message : `Successfully reset voter. ${resetMessage.message}`);
}
