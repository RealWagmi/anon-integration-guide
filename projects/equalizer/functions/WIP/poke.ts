import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../../constants';
import { voterAbi } from '../../abis/voterAbi';

interface Props {
    chainName: string;
    account: Address;
    voterAddress: Address;
    tokenId: string;
}

export async function poke({ chainName, account, voterAddress, tokenId }: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    if (!voterAddress) return toResult('Voter address is required', true);

    const tokenIdBn = BigInt(tokenId);

    await notify('Preparing to poke voter...');

    const transactions: TransactionParams[] = [];

    const pokeTx: TransactionParams = {
        target: voterAddress,
        data: encodeFunctionData({
            abi: voterAbi,
            functionName: 'poke',
            args: [tokenIdBn],
        }),
    };
    transactions.push(pokeTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const pokeMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? pokeMessage.message : `Successfully poked voter. ${pokeMessage.message}`);
}
