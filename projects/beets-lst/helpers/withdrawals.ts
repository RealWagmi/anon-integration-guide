import { Address, formatUnits, PublicClient } from 'viem';
import { STS_ADDRESS, STS_HELPER_ADDRESS } from '../constants';
import { stsAbi, stsHelperAbi } from '../abis';

/**
 * Information about a withdraw request
 */
export interface WithdrawRequestInfo {
    id: number;
    amount: string;
    readyTime: Date;
    isReady: boolean;
    isWithdrawn: boolean;
    timeRemaining: string | null;
    user: Address;
}

/**
 * Information about a withdraw request, mirrors the smart contract
 * struct with the same name
 */
export interface WithdrawRequest {
    id: bigint;
    kind: number;
    validatorId: bigint;
    assetAmount: bigint;
    isWithdrawn: boolean;
    requestTimestamp: bigint;
    user: `0x${string}`;
}

/**
 * Get all open withdrawal requests for a user, that is, all withdrawal
 * requests that are either pending or ready to be claimed
 */
export async function getOpenWithdrawalRequests(account: Address, publicClient: PublicClient, onlyClaimable: boolean = false): Promise<WithdrawRequestInfo[]> {
    // Get the withdraw delay period
    const withdrawDelay = await publicClient.readContract({
        address: STS_ADDRESS,
        abi: stsAbi,
        functionName: 'withdrawDelay',
    });

    // Get the total number of withdraws
    const numWithdraws = await publicClient.readContract({
        address: STS_ADDRESS,
        abi: stsAbi,
        functionName: 'userNumWithdraws',
        args: [account],
    });

    if (numWithdraws === 0n) {
        return [];
    }

    // Get all withdraws for the user
    const withdrawals = await publicClient.readContract({
        address: STS_HELPER_ADDRESS,
        abi: stsHelperAbi,
        functionName: 'getUserWithdraws',
        args: [account, 0n, numWithdraws, false],
    });

    const openWithdrawals: WithdrawRequestInfo[] = [];

    for (let i = 0; i < withdrawals.length; i++) {
        const withdrawal = toWithdrawRequestInfo(withdrawals[i], withdrawDelay);

        if (withdrawal.isWithdrawn) continue;

        if (withdrawal.isReady || !onlyClaimable) {
            openWithdrawals.push(withdrawal);
        }
    }

    return openWithdrawals;
}

/**
 * Get a withdrawal request from the smart contract, by its ID; return null if
 * the withdrawal request does not exist
 */
export async function getWithdrawalRequest(withdrawId: number, publicClient: PublicClient): Promise<WithdrawRequest | null> {
    const withdrawRequest = await publicClient.readContract({
        address: STS_HELPER_ADDRESS,
        abi: stsHelperAbi,
        functionName: 'getWithdrawRequest',
        args: [BigInt(withdrawId)],
    });

    if (!withdrawRequest) return null;

    return withdrawRequest;
}

/**
 * Get a withdrawal request by its ID and conver it to a WithdrawReqeustInfo
 * object; to do so, we need to get the withdraw delay period from the
 * smart contract: use this function sparingly
 */
export async function getWithdrawalRequestInfo(withdrawId: number, publicClient: PublicClient): Promise<WithdrawRequestInfo | null> {
    const withdrawRequest = await getWithdrawalRequest(withdrawId, publicClient);
    if (!withdrawRequest) return null;

    const withdrawDelay = await publicClient.readContract({
        address: STS_ADDRESS,
        abi: stsAbi,
        functionName: 'withdrawDelay',
    });

    return toWithdrawRequestInfo(withdrawRequest, withdrawDelay);
}

/**
 * Convert a WithdrawRequest struct from the smart contract to a
 * WithdrawRequestInfo typescript object, which is a more user-friendly
 * representation
 */
export function toWithdrawRequestInfo(withdrawRequest: WithdrawRequest, withdrawDelay: bigint): WithdrawRequestInfo {
    const currentTime = Math.floor(Date.now() / 1000);
    const readyTimestamp = Number(withdrawRequest.requestTimestamp) + Number(withdrawDelay);
    const remainingTime = readyTimestamp - currentTime;

    return {
        id: Number(withdrawRequest.id),
        amount: formatUnits(withdrawRequest.assetAmount, 18),
        readyTime: new Date(readyTimestamp * 1000),
        isReady: remainingTime <= 0,
        isWithdrawn: withdrawRequest.isWithdrawn,
        timeRemaining: formatTimeRemaining(remainingTime),
        user: withdrawRequest.user,
    };
}

/**
 * Format the remaining time until a withdraw request can be claimed
 */
export function formatTimeRemaining(remainingSeconds: number): string {
    if (remainingSeconds <= 0) return 'Ready to claim';

    const days = Math.floor(remainingSeconds / (24 * 3600));
    const hours = Math.floor((remainingSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);

    const parts = [];
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes > 0 && days === 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);

    return parts.length > 0 ? `${parts.join(' and ')} to claim` : 'Less than a minute to claim';
}
