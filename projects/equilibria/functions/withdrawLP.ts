import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains, PENDLE_BOOSTER_ADDRESS } from '../constants';
import { PendleBooster } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    poolId: number;
    amount: string;
}

/**
 * Withdraws LP tokens from Equilibria's PendleBooster contract
 * @param props - The function parameters
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function withdrawLP(
    { chainName, account, poolId, amount }: Props,
    { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equilibria protocol is not supported on ${chainName}`, true);

    // Validate amount
    if (amount === '0') return toResult('Amount must be greater than 0', true);

    await notify('Preparing to withdraw LP tokens...');

    const transactions: TransactionParams[] = [];

    // Prepare withdraw transaction
    const withdrawTx: TransactionParams = {
        target: PENDLE_BOOSTER_ADDRESS,
        data: encodeFunctionData({
            abi: PendleBooster,
            functionName: 'withdraw',
            args: [BigInt(poolId), BigInt(amount)],
        }),
    };
    transactions.push(withdrawTx);

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const withdrawMessage = result.data[result.data.length - 1];

    return toResult(
        result.isMultisig 
            ? withdrawMessage.message 
            : `Successfully withdrew ${amount} LP tokens from pool ${poolId}. ${withdrawMessage.message}`
    );
} 