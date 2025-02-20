import { Address } from 'viem';
import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { getOpenWithdrawRequests } from '../helpers/withdrawals';

interface Props {
    chainName: string;
    account: Address;
}

export async function getNextWithdrawal({ chainName, account }: Props, { notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    const publicClient = getProvider(chainId);

    await notify(`Getting next withdrawal details...`);

    // Get all withdraws for the user, including non-claimable ones
    const withdraws = await getOpenWithdrawRequests(account, publicClient, false);

    if (withdraws.length === 0) {
        return toResult('No pending or claimable withdrawals found');
    }

    // Sort withdraws: ready first, then by timestamp
    withdraws.sort((a, b) => {
        if (a.isReady !== b.isReady) {
            return a.isReady ? -1 : 1;
        }
        return a.readyTime.getTime() - b.readyTime.getTime();
    });

    const nextWithdraw = withdraws[0];
    const status = nextWithdraw.isReady ? 'is ready to claim' : `will be ready ${nextWithdraw.timeRemaining}`;

    return toResult(`Next withdrawal (ID ${nextWithdraw.id}) of amount ${nextWithdraw.amount} S ${status}`);
}
