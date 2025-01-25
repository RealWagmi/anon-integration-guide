import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { veNftAbi } from '../abis/veNftAbi';

interface Props {
    chainName: string;
    account: Address;
    vestedAddress: Address;
    tokenId: string;
}

export async function withdrawTokensFromExpiredVe({ chainName, account, vestedAddress, tokenId }: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    if (!vestedAddress) return toResult('Vested address is required', true);

    const tokenIdBn = BigInt(tokenId);

    await notify('Preparing to withdraw tokens from expired vested position...');

    const transactions: TransactionParams[] = [];

    const withdrawTx: TransactionParams = {
        target: vestedAddress,
        data: encodeFunctionData({
            abi: veNftAbi,
            functionName: 'withdraw',
            args: [tokenIdBn],
        }),
    };
    transactions.push(withdrawTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const withdrawMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? withdrawMessage.message : `Successfully withdrew tokens from expired vested position. ${withdrawMessage.message}`);
}
