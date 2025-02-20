import { ChainId, FunctionOptions, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, decodeFunctionResult, encodeFunctionData, erc20Abi, formatUnits } from 'viem';
import { rewardsDistributor, SONIC_TOKENS, veSWPxAddress } from '../../constants';
import { VotingEscrow } from '../../utils/VotingEscrow';
import { rewardsDistributorAbi } from '../../abis/rewardsDistributorAbi';
import { MultiCall } from '../../utils/MultiCall';
import { votingEscrowAbi } from '../../abis/votingEscrowAbi';

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

    const uniqueTokenIds = new Set(tokenIds);
    if (uniqueTokenIds.size !== tokenIds.length) {
        return toResult('Duplicate token IDs are not allowed', true);
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

    const multicall = new MultiCall(provider);

    const timestampNow = (await provider.getBlock()).timestamp;

    const preData = await Promise.all(
        (
            await multicall.multicall(
                tokenIds.map((t) => ({
                    target: veSWPxAddress,
                    bytes: encodeFunctionData({
                        abi: votingEscrowAbi,
                        functionName: 'locked',
                        args: [t],
                    }),
                })),
            )
        ).map(async (locked, i) => {
            const tokenId = tokenIds[i];
            const [, , end] = decodeFunctionResult({ abi: votingEscrowAbi, data: locked, functionName: 'locked' }) as [bigint, bigint, bigint];
            const isVesting = end >= timestampNow;
            const balance = isVesting
                ? await ve.getBalanceOfNFT(tokenId)
                : await provider.readContract({
                      abi: erc20Abi,
                      functionName: 'balanceOf',
                      address: SONIC_TOKENS.SWPx.address,
                      args: [account],
                  });

            return {
                isVesting,
                balance,
            };
        }),
    );

    const result = await sendTransactions({ chainId, account, transactions });
    const claimMessage = result.data[result.data.length - 1];
    let msg = '';

    tokenIds.map(async (tokenId, i) => {
        const { balance: preBalance, isVesting } = preData[i];
        const balance = isVesting
            ? await ve.getBalanceOfNFT(tokenId)
            : await provider.readContract({
                  abi: erc20Abi,
                  functionName: 'balanceOf',
                  address: SONIC_TOKENS.SWPx.address,
                  args: [account],
              });
        const claimed = balance - preBalance;
        const decimals = SONIC_TOKENS.SWPx.decimals;
        msg += `    #${tokenId} Claimed ${formatUnits(claimed, decimals)} SWPx to ${isVesting ? 'veSWPX position' : 'account'}\n`;
    });

    return toResult(result.isMultisig ? claimMessage.message : `Successfully Claimed ${claimMessage} SWPx Rewards.\n${msg}${claimMessage.message}`);
}
