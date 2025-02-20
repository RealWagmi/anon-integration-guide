import { ChainId, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { formatUnits } from 'viem';
import { SONIC_TOKENS } from '../../constants';
import { RewardsDistributor } from '../../utils/RewardsDistributor';

interface Props {
    tokenId: bigint;
}

export async function getRewards({ tokenId }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = ChainId.SONIC;

    const provider = getProvider(chainId);

    const dist = new RewardsDistributor(provider);

    const pendingRewards = await dist.getDistClaimable(tokenId);

    return toResult(`Token ID #${tokenId} Pending Rewards: ${formatUnits(pendingRewards, SONIC_TOKENS.SWPx.decimals)} SWPx`);
}
