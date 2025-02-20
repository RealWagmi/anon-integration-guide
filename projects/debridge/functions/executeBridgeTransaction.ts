import { FunctionReturn, FunctionOptions, toResult, TransactionParams } from '@heyanon/sdk';
import { Address } from 'viem';

export interface Props {
    chainId: string;
    account: Address;
    transactionData: {
        target: `0x${string}`;
        data: `0x${string}`;
        value?: bigint;
    };
}

/**
 * Execute a bridge transaction on the blockchain.
 * This function takes the transaction data from createBridgeOrder and executes it.
 * 
 * @param props - The function parameters
 * @param props.chainId - Chain ID where the transaction will be executed
 * @param props.account - User's wallet address
 * @param props.transactionData - Transaction data from createBridgeOrder
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function executeBridgeTransaction(
    { chainId, account, transactionData }: Props,
    { notify, sendTransactions }: FunctionOptions
): Promise<FunctionReturn> {
    try {
        // Check wallet connection
        if (!account) return toResult('Wallet not connected', true);

        // Convert chainId to number
        const numericChainId = parseInt(chainId, 10);
        if (isNaN(numericChainId)) {
            return toResult('Invalid chain ID', true);
        }

        // Validate transaction data
        if (!transactionData.target || !transactionData.data) {
            return toResult('Invalid transaction data', true);
        }

        // Create transaction parameters
        const transaction: TransactionParams = {
            target: transactionData.target,
            data: transactionData.data,
            value: transactionData.value || 0n,
        };

        // Send the transaction
        await notify('Executing bridge transaction...');
        const result = await sendTransactions({
            chainId: numericChainId,
            account,
            transactions: [transaction],
        });

        const message = result.data[result.data.length - 1];
        return toResult(`Bridge transaction executed successfully! ${message.message}`);
    } catch (error) {
        return toResult(`Failed to execute bridge transaction: ${error}`, true);
    }
}
