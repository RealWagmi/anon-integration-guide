import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { superVoterAbi } from '../abis/superVoterAbi';

interface Props {
    chainName: string;
    account: Address;
    superVoterAddress: Address;
    nftIds: string[];
    votePools: Address[];
    voteCounts: string[];
    maxLock: boolean;
}

export async function voteMultiple(
    { chainName, account, superVoterAddress, nftIds, votePools, voteCounts, maxLock }: Props,
    { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equalizer is not supported on ${chainName}`, true);

    if (!superVoterAddress) return toResult('Super Voter address is required', true);
    if (!nftIds.length) return toResult('At least one NFT ID is required', true);
    if (!votePools.length) return toResult('At least one vote pool is required', true);
    if (!voteCounts.length) return toResult('At least one vote count is required', true);
    if (votePools.length !== voteCounts.length) return toResult('Vote pools and counts must have the same length', true);

    const nftIdsBn = nftIds.map((id) => BigInt(id));
    const voteCountsBn = voteCounts.map((count) => BigInt(count));

    await notify('Preparing to vote with multiple positions...');

    const transactions: TransactionParams[] = [];

    const voteTx: TransactionParams = {
        target: superVoterAddress,
        data: encodeFunctionData({
            abi: superVoterAbi,
            functionName: 'voteMultiple',
            args: [maxLock, nftIdsBn, votePools, voteCountsBn],
        }),
    };
    transactions.push(voteTx);

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const voteMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? voteMessage.message : `Successfully voted with multiple positions. ${voteMessage.message}`);
}
