import { ChainId, FunctionOptions, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData, formatUnits } from 'viem';
import { SONIC_TOKENS, veSWPxAddress } from '../../constants';
import { epochTimestampInSecToDate } from '../../utils';
import { votingEscrowAbi } from '../../abis/votingEscrowAbi';
import { VotingEscrow } from '../../utils/VotingEscrow';

interface Props {
    account: Address;
    tokenId: bigint;
}

export async function unlockSWPx({ account, tokenId }: Props, { sendTransactions, notify, getProvider }: FunctionOptions) {
    if (!account) return toResult('Wallet not connected', true);

    await notify('Preparing to lock SWPx...');

    const chainId = ChainId.SONIC;

    const provider = getProvider(chainId);

    const ve = new VotingEscrow(provider);

    const owner = await ve.getLockTokenIdOwner(tokenId);

    if (account != owner) return toResult(`You are not the #${tokenId} owner!`, true);

    const timestampNow = (await provider.getBlock()).timestamp;

    const { endLockTime, amount } = await ve.getLockTokenIdInfo(tokenId);

    const expireTimeStr = epochTimestampInSecToDate(endLockTime);

    if (endLockTime > timestampNow) toResult(`Cannot unlock the token ID #${tokenId}, it would expires at ${expireTimeStr}`, true);

    const isAttached = await ve.isLockTokenIdAttached(tokenId);

    if (isAttached) return toResult(`Token ID #${tokenId} is attached!`, true);

    const transactions: TransactionParams[] = [];

    transactions.push({
        target: veSWPxAddress,
        data: encodeFunctionData({
            abi: votingEscrowAbi,
            functionName: 'withdraw',
            args: [tokenId],
        }),
    });

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const lockMessage = result.data[result.data.length - 1];

    return toResult(
        result.isMultisig ? lockMessage.message : `Successfully unlocked #${tokenId} with ${formatUnits(amount, SONIC_TOKENS.SWPx.decimals)} SWPx. ${lockMessage.message}`,
    );
}
