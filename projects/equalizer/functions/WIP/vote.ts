import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../../constants';
import { voterAbi } from '../../abis/voterAbi';

interface Props {
    chainName: string;
    account: Address;
    voterAddress: Address;
    tokenId: string;
    voteTokens: Address[];
    voteCounts: string[];
}

export async function vote({ chainName, account, voterAddress, tokenId, voteTokens, voteCounts }: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    if (!voterAddress) return toResult('Voter address is required', true);
    if (!voteTokens.length) return toResult('At least one vote token is required', true);
    if (!voteCounts.length) return toResult('At least one vote count is required', true);
    if (voteTokens.length !== voteCounts.length) return toResult('Vote tokens and counts must have the same length', true);

    const tokenIdBn = BigInt(tokenId);
    const voteCountsBn = voteCounts.map((count) => BigInt(count));

    await notify('Preparing to vote...');

    const transactions: TransactionParams[] = [];

    const voteTx: TransactionParams = {
        target: voterAddress,
        data: encodeFunctionData({
            abi: voterAbi,
            functionName: 'vote',
            args: [tokenIdBn, voteTokens, voteCountsBn],
        }),
    };
    transactions.push(voteTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const voteMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? voteMessage.message : `Successfully voted. ${voteMessage.message}`);
}
