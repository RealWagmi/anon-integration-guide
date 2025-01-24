import { FunctionOptions, FunctionReturn, toResult, TransactionParams } from '@heyanon/sdk';
import { Address, encodeFunctionData } from 'viem';
import gaugeControllerAbi from '../abis/gaugeController';
import { GAUGE_CONTROLLER_PROXY_ADDRESS, NodesWithWeightsProps } from '../constants';
import { parseNodesWithWeights, parseWallet } from '../utils';

type Props = NodesWithWeightsProps & {
    chainName: string;
    account: Address;
};

/**
 * Updates votes for specified nodes
 * @param props - The function `Props`
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function unvoteNodes(props: Props, { sendTransactions, notify }: FunctionOptions): Promise<FunctionReturn> {
    const wallet = parseWallet(props);

    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }

    const { account, chainId } = wallet.data;

    const nodes = parseNodesWithWeights(props);

    if (!nodes.success) {
        return toResult(nodes.errorMessage, true);
    }

    const transactions: TransactionParams[] = [];

    await notify('Unvote nodes transaction...');

    const tx: TransactionParams = {
        target: GAUGE_CONTROLLER_PROXY_ADDRESS,
        data: encodeFunctionData({
            abi: gaugeControllerAbi,
            functionName: 'unvoteNodes',
            args: [nodes.data.nodeIds, nodes.data.weights],
        }),
    };

    transactions.push(tx);

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(result.isMultisig ? message.message : `Successfully updated votes. ${message.message}`);
}
