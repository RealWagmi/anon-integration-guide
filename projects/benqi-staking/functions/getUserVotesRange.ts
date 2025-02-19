import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address } from 'viem';
import gaugeController from '../abis/gaugeController';
import { GAUGE_CONTROLLER_PROXY_ADDRESS } from '../constants';
import { formatWeight, parseRange, parseWallet } from '../utils/parse';

type Props = {
    chainName: string;
    account: Address;
    from: number;
    to: number;
};

/**
 * Get list of nodes with weights the user has voted for
 * @param props - The function {@link Props}
 * @param tools - System tools for blockchain interactions
 * @returns Amount of user votes
 */
export async function getUserVotesRange(props: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const range = parseRange(props);

    if (!range.success) {
        return toResult(range.errorMessage, true);
    }

    const { chainId } = wallet.data;

    const provider = getProvider(chainId);

    const [nodes, votes] = await provider.readContract({
        abi: gaugeController,
        address: GAUGE_CONTROLLER_PROXY_ADDRESS,
        functionName: 'getUserVotesRange',
        args: [range.data.from, range.data.to],
    });

    if (nodes.length === 0) return toResult('User has not voted for any nodes');

    const nodeListMessage = nodes.map((node, index) => `${node} with weight of ${formatWeight(votes[index] ?? 0n)}%`).join('\n');
    const message = 'User has voted for following node list:\n' + nodeListMessage;

    return toResult(message);
}
