import { ChainId, FunctionOptions, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import { VotingEscrow } from '../../utils/VotingEscrow';
import { voterV3Abi } from '../../abis/VoterV3Abi';
import { voterV3Address } from '../../constants';

interface Props {
    account: Address;
    tokenId: bigint;
    poolVotes: { pool: Address; weight: bigint }[];
}

export async function vote({ tokenId, account, poolVotes }: Props, { sendTransactions, notify, getProvider }: FunctionOptions) {
    if (!account) return toResult('Wallet not connected', true);

    await notify('Preparing to vote on pools...');

    const chainId = ChainId.SONIC;

    const provider = getProvider(chainId);

    const ve = new VotingEscrow(provider);

    const owner = await ve.getLockTokenIdOwner(tokenId);
    if (account != owner) return toResult(`You are not the #${tokenId} owner!`, true);

    const transactions: TransactionParams[] = [];

    transactions.push({
        target: voterV3Address,
        data: encodeFunctionData({
            abi: voterV3Abi,
            functionName: 'vote',
            args: [tokenId, poolVotes.map((p) => p.pool), poolVotes.map((p) => p.weight)],
        }),
    });

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });

    const lockMessage = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? lockMessage.message : `Successfully Voted on ${poolVotes.length} pools. ${lockMessage.message}`);
}
