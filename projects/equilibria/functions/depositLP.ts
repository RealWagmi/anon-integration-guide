import { Address, encodeFunctionData, parseUnits } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName, checkToApprove } from '@heyanon/sdk';
import { supportedChains, PENDLE_BOOSTER_ADDRESS } from '../constants';
import { PendleBooster } from '../abis';

interface Props {
    chainName: string;
    account: Address;
    poolId: number;
    amount: string;
    stake?: boolean;
    lpTokenAddress: Address;
}

/**
 * Deposits LP tokens into Equilibria's PendleBooster contract
 * @param props - The function parameters
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function depositLP(
    { chainName, account, poolId, amount, stake = true, lpTokenAddress }: Props, 
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Check wallet connection
    if (!account) return toResult('Wallet not connected', true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Equilibria protocol is not supported on ${chainName}`, true);

    // Validate amount
    const amountInWei = parseUnits(amount, 18);
    if (amountInWei === 0n) return toResult('Amount must be greater than 0', true);

    await notify('Preparing to deposit LP tokens...');

    const provider = getProvider(chainId);
    const transactions: TransactionParams[] = [];

    // Check and prepare approve transaction if needed
    await checkToApprove({
        args: {
            account,
            target: lpTokenAddress,
            spender: PENDLE_BOOSTER_ADDRESS,
            amount: amountInWei,
        },
        provider,
        transactions
    });

    // Prepare deposit transaction
    const depositTx: TransactionParams = {
        target: PENDLE_BOOSTER_ADDRESS,
        data: encodeFunctionData({
            abi: PendleBooster,
            functionName: 'deposit',
            args: [BigInt(poolId), amountInWei, stake],
        }),
    };
    transactions.push(depositTx);

    await notify('Waiting for transaction confirmation...');

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const depositMessage = result.data[result.data.length - 1];

    return toResult(
        result.isMultisig 
            ? depositMessage.message 
            : `Successfully deposited ${amount} LP tokens to pool ${poolId}. ${depositMessage.message}`
    );
}
