import { getChainFromName } from '@heyanon/sdk';
import { Address, formatUnits, isAddress, parseUnits } from 'viem';
import { NodesProps, NodesWithWeightsProps, supportedChains } from './constants';

type Result<Data> =
    | {
          success: false;
          errorMessage: string;
      }
    | {
          success: true;
          data: Data;
      };

export const parseWallet = <Props extends { account: string; chainName: string }>({ account, chainName }: Props): Result<{ account: Address; chainId: number }> => {
    if (!account) return { success: false, errorMessage: 'Wallet not connected' };
    if (!isAddress(account)) return { success: false, errorMessage: 'Expected account to be a valid address' };

    const chainId = getChainFromName(chainName);

    if (!chainId) return { success: false, errorMessage: `Unsupported chain name: ${chainName}` };
    if (!supportedChains.includes(chainId)) return { success: false, errorMessage: `Protocol is not supported on ${chainName}` };

    return {
        success: true,
        data: {
            account,
            chainId,
        },
    };
};

export const parseAmount = <Props extends { amount: string; decimals: number }>({ amount, decimals }: Props): Result<bigint> => {
    if (!amount || typeof amount !== 'string') return { success: false, errorMessage: 'Amount must be a string' };

    const parsedAmount = parseUnits(amount, decimals);
    if (parsedAmount === 0n) return { success: false, errorMessage: 'Amount must be greater than 0' };

    return {
        success: true,
        data: parsedAmount,
    };
};

export const parseNodes = <Props extends NodesProps>({ nodeIds }: Props): Result<NodesProps> => {
    if (!Array.isArray(nodeIds)) return { success: false, errorMessage: 'Expected nodeIds to be an array' };

    if (nodeIds.length === 0) return { success: false, errorMessage: 'Expected at least one node id' };

    return {
        success: true,
        data: {
            nodeIds,
        },
    };
};

export const parseWeight = (weight: string) => parseUnits(weight, 2);
export const formatWeight = (weight: bigint) => formatUnits(weight, 2);

export const parseNodesWithWeights = <Props extends NodesWithWeightsProps>(
    props: Props,
): Result<{
    nodeIds: string[];
    weights: bigint[];
}> => {
    const nodes = parseNodes(props);

    if (!nodes.success) {
        return nodes;
    }

    const { nodeIds } = nodes.data;
    const { weights } = props;

    if (!Array.isArray(weights)) return { success: false, errorMessage: 'Expected nodeIds to be an array' };

    if (weights.length === 0) return { success: false, errorMessage: 'Expected at least one weight' };

    if (nodeIds.length !== weights.length) return { success: false, errorMessage: 'Expected nodeIds and weights to be the same length' };

    const parsedWeights = weights.map((weight) => parseWeight(weight));

    const sum = parsedWeights.reduce((acc, weight) => acc + weight, 0n);

    if (sum > parseWeight('100')) return { success: false, errorMessage: 'Sum of weights must be less than or equal to 100' };

    return {
        success: true,
        data: {
            nodeIds,
            weights: parsedWeights,
        },
    };
};

export const parseRange = <Props extends { from: number; to: number }>(props: Props): Result<{ from: bigint; to: bigint }> => {
    const { from, to } = props;

    if (typeof from !== 'number' || typeof to !== 'number') return { success: false, errorMessage: 'Expected from and to to be numbers' };

    if (from >= to) return { success: false, errorMessage: 'Expected from to be less than to' };

    return {
        success: true,
        data: {
            from: BigInt(from),
            to: BigInt(to),
        },
    };
};
