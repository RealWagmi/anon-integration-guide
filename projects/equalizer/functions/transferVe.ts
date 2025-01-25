import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { veNftAbi } from '../abis/veNftAbi';

interface Props {
    chainName: string;
    account: Address;
    vestedAddress: Address;
    toAccount: Address;
    tokenId: string;
}

export async function transferVe({ chainName, account, vestedAddress, toAccount, tokenId }: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    if (!vestedAddress) return toResult('Vested address is required', true);
    if (!toAccount) return toResult('Recipient address is required', true);

    const tokenIdBn = BigInt(tokenId);

    await notify('Preparing to transfer vested position...');

    const transactions: TransactionParams[] = [];

    const transferTx: TransactionParams = {
        target: vestedAddress,
        data: encodeFunctionData({
            abi: veNftAbi,
            functionName: 'transferFrom',
            args: [account, toAccount, tokenIdBn],
        }),
    };
    transactions.push(transferTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const transferMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? transferMessage.message : `Successfully transferred vested position. ${transferMessage.message}`);
}
