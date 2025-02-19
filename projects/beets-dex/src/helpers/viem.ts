import { PublicWalletClient } from '@balancer/sdk';
import { FunctionOptions, SendTransactionProps, TransactionParams, TransactionReturn } from '@heyanon/sdk';
import { Address, Hex, PublicClient, SignTypedDataParameters, TransactionReceipt } from 'viem';

export interface SendTransactionsAndWaitForReceiptsProps {
    publicClient: PublicClient;
    transactions: TransactionParams[];
    sendTransactions: (transactions: SendTransactionProps) => Promise<TransactionReturn>;
    account: Address;
    chainId: number;
}

export interface SendTransactionsAndWaitForReceiptsResult {
    hashes: Hex[];
    messages: string[];
    receipts: TransactionReceipt[];
}

/**
 * Get a mock PublicWalletClient that can be used to sign typed data.
 */
export function getMockPublicWalletClient(publicClient: PublicClient, options: FunctionOptions): PublicWalletClient {
    return publicClient.extend((client) => ({
        signTypedData: async (typedData: SignTypedDataParameters) => {
            if (!options.signTypedDatas) {
                throw new Error('signTypedDatas not provided in options');
            }
            const signatures = await options.signTypedDatas([typedData]);
            return signatures[0];
        },
    })) as unknown as PublicWalletClient;
}

/**
 * Send the given transactions, in the HeyAnon format, and wait for the
 * receipts.
 */
export async function sendTransactionsAndWaitForReceipts({
    publicClient,
    transactions,
    sendTransactions,
    account,
    chainId,
}: SendTransactionsAndWaitForReceiptsProps): Promise<SendTransactionsAndWaitForReceiptsResult> {
    const result = await sendTransactions({
        chainId,
        account,
        transactions,
    });
    const receipts = await Promise.all(result.data.map((tx) => publicClient.waitForTransactionReceipt({ hash: tx.hash })));
    return {
        hashes: result.data.map((tx) => tx.hash),
        messages: result.data.map((tx) => tx.message),
        receipts,
    };
}
