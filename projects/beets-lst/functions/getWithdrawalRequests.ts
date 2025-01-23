import { Address, formatUnits } from 'viem';
import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { supportedChains, STS_ADDRESS, STS_HELPER_ADDRESS } from '../constants';
import { stsAbi, stsHelperAbi } from '../abis';

interface Props {
    chainName: string;
    account: Address;
}

interface WithdrawRequestInfo {
    id: number;
    amount: string;
    readyTime: Date;
    isReady: boolean;
    timeRemaining: string | null;
    index: number;
}

function formatTimeRemaining(remainingSeconds: number): string {
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

export async function getWithdrawalRequests({ chainName, account }: Props, { notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    const publicClient = getProvider(chainId);

    await notify(`Getting existing withdrawal requests...`);

    // Get the withdraw delay period
    const withdrawDelay = await publicClient.readContract({
        address: STS_ADDRESS,
        abi: stsAbi,
        functionName: 'withdrawDelay',
    });

    // Get the total number of withdraws for pagination
    const numWithdraws = await publicClient.readContract({
        address: STS_ADDRESS,
        abi: stsAbi,
        functionName: 'userNumWithdraws',
        args: [account],
    });

    if (numWithdraws === 0n) {
        return toResult('No pending or unclaimed withdrawals found');
    }

    // Get all withdraws for the user
    const withdraws = await publicClient.readContract({
        address: STS_HELPER_ADDRESS,
        abi: stsHelperAbi,
        functionName: 'getUserWithdraws',
        args: [account, 0n, numWithdraws, false], // Get all withdraws, not reversed
    });

    const currentTime = Math.floor(Date.now() / 1000);
    const pendingWithdraws: WithdrawRequestInfo[] = [];

    // Process each withdraw request
    for (let i = 0; i < withdraws.length; i++) {
        const withdraw = withdraws[i];
        // Skip if already withdrawn
        if (withdraw.isWithdrawn) continue;

        const readyTimestamp = Number(withdraw.requestTimestamp) + Number(withdrawDelay);
        const remainingTime = readyTimestamp - currentTime;
        const isReady = remainingTime <= 0;

        pendingWithdraws.push({
            id: Number(withdraw.id),
            amount: formatUnits(withdraw.assetAmount, 18),
            readyTime: new Date(readyTimestamp * 1000),
            isReady,
            timeRemaining: formatTimeRemaining(remainingTime),
            index: i,
        });
    }

    if (pendingWithdraws.length === 0) {
        return toResult('No pending withdrawals found');
    }

    // Sort withdraws: ready first, then by timestamp
    pendingWithdraws.sort((a, b) => {
        if (a.isReady !== b.isReady) {
            return a.isReady ? -1 : 1;
        }
        return a.readyTime.getTime() - b.readyTime.getTime();
    });

    // Format the response with withdraw IDs
    const withdrawalsList = pendingWithdraws.map((w) => `- Withdraw ID ${w.id}: ${w.amount} S (${w.timeRemaining})`).join('\n');

    return toResult(`Pending withdrawals:\n${withdrawalsList}`);
}
