import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address } from 'viem';
import gaugeController from '../abis/gaugeController';
import { GAUGE_CONTROLLER_PROXY_ADDRESS } from '../constants';
import { parseWallet } from '../utils/parse';

type Props = {
    chainName: string;
    account: Address;
};

/**
 * Get amount of votes a user has
 * @param props - The function {@link Props}
 * @param tools - System tools for blockchain interactions
 * @returns Amount of user votes
 */
export async function getUserVotesLength(props: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const { chainId } = wallet.data;

    const provider = getProvider(chainId);

    const votesLength = await provider.readContract({
        abi: gaugeController,
        address: GAUGE_CONTROLLER_PROXY_ADDRESS,
        functionName: 'getUserVotesLength',
        args: [],
    });

    return toResult(`User has ${votesLength} vote${votesLength === 1n ? '' : 's'}`);
}
