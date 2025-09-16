import { PublicClient } from 'viem';
import { rewardsDistributorAbi } from '../../abis/rewardsDistributorAbi';
import { rewardsDistributor } from '../../constants';

export class RewardsDistributor {
    provider: PublicClient;

    constructor(_provider: PublicClient) {
        this.provider = _provider;
    }

    async getDistClaimable(tokenId: bigint) {
        return (await this.provider.readContract({
            abi: rewardsDistributorAbi,
            address: rewardsDistributor,
            functionName: 'claimable',
            args: [tokenId],
        })) as bigint;
    }
}
