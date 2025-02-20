import { Address } from 'viem';
import { FunctionReturn, toResult, EVM, FunctionOptions, EvmChain } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { getOpenWithdrawRequests as getOpenWithdrawRequestsHelper } from '../helpers/withdrawals';

interface Props {
    chainName: string;
    account: Address;
}

export async function getOpenWithdrawRequests({ chainName, account }: Props, { notify, evm: { getProvider } }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);

    const publicClient = getProvider(chainId);

    await notify(`Getting existing withdraw requests...`);

    // Get all withdraws for the user, including non-claimable ones
    const withdraws = await getOpenWithdrawRequestsHelper(account, publicClient, false);

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

    // Format the response with withdraw IDs
    const withdrawalsList = withdraws.map((w) => `- Withdraw ID ${w.id} of amount ${w.amount} S (${w.timeRemaining})`).join('\n');

    return toResult(`Pending withdrawals:\n${withdrawalsList}`);
}
