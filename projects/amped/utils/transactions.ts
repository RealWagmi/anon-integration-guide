import { type PublicClient, type WalletClient, type Hash } from 'viem';

export interface TransactionOptions {
  publicClient: PublicClient;
  walletClient: WalletClient;
  account: `0x${string}`;
  notify?: (message: string) => void;
}

export interface TransactionRequest {
  address: `0x${string}`;
  abi: any;
  functionName: string;
  args: any[];
  value?: bigint;
}

export async function sendTransaction(
  request: TransactionRequest,
  options: TransactionOptions
): Promise<Hash> {
  const { publicClient, walletClient, account, notify } = options;
  const { address, abi, functionName, args, value } = request;

  try {
    if (notify) notify(`Preparing ${functionName} transaction...`);

    // Simulate the transaction first
    const { request: simulatedRequest } = await publicClient.simulateContract({
      address,
      abi,
      functionName,
      args,
      account,
      value,
    });

    if (notify) notify(`Sending ${functionName} transaction...`);

    // Send the actual transaction
    const hash = await walletClient.writeContract(simulatedRequest);

    if (notify) notify(`Transaction sent: ${hash}`);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (notify) notify(`Transaction confirmed: ${hash}`);

    return hash;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}