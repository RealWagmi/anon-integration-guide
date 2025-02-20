import { Address, PublicClient } from 'viem';
import { votingEscrowAbi } from '../../abis/votingEscrowAbi';
import { veSWPxAddress } from '../../constants';

interface LockInfo {
    lockId: bigint;
    amount: string;
    unlockTime: bigint;
}

export class VotingEscrow {
    provider: PublicClient;

    constructor(_provider: PublicClient) {
        this.provider = _provider;
    }

    async getBalanceOfNFT(tokenId: bigint) {
        return (await this.provider.readContract({
            abi: votingEscrowAbi,
            address: veSWPxAddress,
            functionName: 'balanceOfNFT',
            args: [tokenId],
        })) as bigint;
    }

    async getSwpxLocksTokenIds(account: Address) {
        const numLocks = (await this.provider.readContract({
            abi: votingEscrowAbi,
            address: veSWPxAddress,
            functionName: 'balanceOf',
            args: [account],
        })) as bigint;

        let lockInfos: LockInfo[] = [];

        for (let i = 0; i < numLocks; i++) {
            let lock: LockInfo = { lockId: 0n, amount: '0', unlockTime: 0n };

            const tokenId = (await this.provider.readContract({
                abi: votingEscrowAbi,
                address: veSWPxAddress,
                functionName: 'tokenOfOwnerByIndex',
                args: [account, i],
            })) as bigint;

            lock.lockId = tokenId;

            const { amount, endLockTime } = await this.getLockTokenIdInfo(tokenId);

            lock.amount = amount.toString();
            lock.unlockTime = endLockTime;

            lockInfos.push(lock);
        }

        return lockInfos;
    }

    async getLockTokenIdOwner(tokenId: bigint) {
        const owner = (await this.provider.readContract({
            abi: votingEscrowAbi,
            address: veSWPxAddress,
            functionName: 'ownerOf',
            args: [tokenId],
        })) as Address;

        return owner;
    }

    async getLockTokenIdInfo(tokenId: bigint) {
        const [amount, startLockTime, endLockTime] = (await this.provider.readContract({
            abi: votingEscrowAbi,
            address: veSWPxAddress,
            functionName: 'locked',
            args: [tokenId],
        })) as [bigint, bigint, bigint];

        return { amount, startLockTime, endLockTime };
    }

    async isLockTokenIdAttached(tokenId: bigint) {
        const attachements = (await this.provider.readContract({
            abi: votingEscrowAbi,
            address: veSWPxAddress,
            functionName: 'attachments',
            args: [tokenId],
        })) as bigint;

        const voted = (await this.provider.readContract({
            abi: votingEscrowAbi,
            address: veSWPxAddress,
            functionName: 'voted',
            args: [tokenId],
        })) as boolean;

        return !(attachements == 0n && !voted);
    }
}
