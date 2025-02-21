import { Address } from 'viem';
import { FunctionReturn, toResult, EVM, FunctionOptions, EvmChain } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { getOpenWithdrawRequests } from '../helpers/withdrawals';

interface Props {
    chainName: string;
    account: Address;
}

/**
 * Retrieves details about the closest-to-withdrawal request for the specified user,
 * including how long until it can be claimed.
 *
 * @param {Object} props - The function input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @param {Address} props.account - The user account address whose withdrawal requests to check
 * @param {FunctionOptions} context - Holds EVM utilities and a notifier
 * @returns {Promise<FunctionReturn>} A message about the next withdrawal request or an error message
 */
export async function getNextWithdrawal({ chainName, account }: Props, { notify, evm: { getProvider } }: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
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
