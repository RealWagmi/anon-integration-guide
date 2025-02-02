import { Address, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName, checkToApprove } from '@heyanon/sdk';
import { NETWORKS } from '../constants.js';

interface Props {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: Address;
    amount: string;
}

/**
 * Example function that demonstrates protocol interaction pattern.
 * @param props - The function parameters
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function example({ chainName, account, amount }: Props, { notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // Validate chain
    if (!Object.values(NETWORKS).includes(chainName)) {
        return toResult(`Network ${chainName} not supported`);
    }

    await notify('Starting example function...');

    try {
        // Example implementation
        return toResult('Example function executed successfully');
    } catch (error) {
        if (error instanceof Error) {
            return toResult(`Failed to execute example: ${error.message}`, true);
        }
        return toResult('Failed to execute example: Unknown error', true);
    }
}
