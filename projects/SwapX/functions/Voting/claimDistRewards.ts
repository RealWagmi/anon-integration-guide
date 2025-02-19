import { ChainId, FunctionOptions, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import { rewardsDistributor } from '../../constants';
import { VotingEscrow } from '../../utils/VotingEscrow';
import { rewardsDistributorAbi } from '../../abis/RewardsDistributorAbi';

interface Props {
    account: Address;
    tokenIds: bigint[];
}

export async function claimDistRewards({ account, tokenIds }: Props, { sendTransactions, notify, getProvider }: FunctionOptions) {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = ChainId.SONIC;
    const provider = getProvider(chainId);

    const ve = new VotingEscrow(provider);

    await notify('Preparing to claim SWPx rewards...');

    for (let tokenId of tokenIds) {
        const owner = await ve.getLockTokenIdOwner(tokenId);
        if (owner != account) toResult(`Token ID #${tokenId} not among your holdings`, true);
    }

    const transactions: TransactionParams[] = [
        {
            target: rewardsDistributor,
            data: encodeFunctionData({
                abi: rewardsDistributorAbi,
                functionName: 'claim_many',
                args: [tokenIds],
            }),
        },
    ];

    await notify('Waiting for transaction confirmation...');

    const result = await sendTransactions({ chainId, account, transactions });
    const claimMessage = result.data[result.data.length - 1];

    const timestampNow = (await provider.getBlock()).timestamp.toString();

    // TODO show the list of SWPx rewards claimed with where they are claimed to (V = Vault | O = Owner)

    return toResult(result.isMultisig ? claimMessage.message : `Successfully Claimed ${claimMessage} SWPx Rewards. ${claimMessage.message}`);
}
