import { Address, encodeFunctionData } from 'viem';
import { checkToApprove, FunctionOptions, FunctionReturn, getChainFromName, toResult, TransactionParams } from '@heyanon/sdk';
import { ADDRESSES, SUPPORTED_CHAINS } from '../constants';
import { swapRouterAbi } from '../abis';
import { amountToWei } from '../utils';
import { callQuoteExactInputSingle } from './quoteExactInputSingle';

interface Props {
    chainName: string;
    account: Address;
    tokenIn: Address;
    tokenOut: Address;
    amountIn: string;
    amountOutMin?: string;
    recipient?: Address;
}

// Questions:
// How to check if user wants to swap native ETH?
// TODO: Support FeeOnTransferTokens?
export async function exactInputSingle(
    { chainName, account, tokenIn, tokenOut, amountIn, amountOutMin, recipient }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions,
): Promise<FunctionReturn> {
    try {
        // Check wallet connection
        if (!account) return toResult('Wallet not connected', true);

        // Validate chain
        const chainId = getChainFromName(chainName);
        if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
        if (!SUPPORTED_CHAINS.includes(chainId)) return toResult(`Camelot V3 is not supported on ${chainName}`, true);

        await notify(`Preparing to swap tokens on Camelot V3...`);

        const provider = getProvider(chainId);

        // Convert amounts to wei
        let [amountInWei, amountOutMinWei] = await Promise.all([amountToWei(provider, tokenIn, amountIn), amountToWei(provider, tokenOut, amountOutMin)]);

        // Simulate swap if amountOutMin is not provided to protect from front-running
        if (!amountOutMin) {
            const quoteResult = await callQuoteExactInputSingle(chainId, provider, tokenIn, tokenOut, amountInWei);
            const amountOut = quoteResult.result[0];

            // Set 0.2% slippage tolerance
            amountOutMinWei = (amountOut * 9998n) / 10000n;
        }

        // Validate amounts
        if (amountInWei === 0n) return toResult('Amount IN must be greater than 0', true);

        if (amountOutMinWei === 0n) return toResult('Amount OUT MIN must be greater than 0', true);

        // Prepare transactions
        const transactions: TransactionParams[] = [];

        // Approvals
        await checkToApprove({
            args: {
                account,
                target: tokenIn,
                spender: ADDRESSES[chainId].SWAP_ROUTER_ADDRESS,
                amount: amountInWei,
            },
            provider,
            transactions,
        });

        // Swap transaction
        const tx: TransactionParams = {
            target: ADDRESSES[chainId].SWAP_ROUTER_ADDRESS,
            data: encodeFunctionData({
                abi: swapRouterAbi,
                functionName: 'exactInputSingle',
                args: [
                    {
                        tokenIn,
                        tokenOut,
                        recipient: recipient ?? account,
                        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 5), // 5 minutes from now
                        amountIn: amountInWei,
                        amountOutMinimum: amountOutMinWei,
                        limitSqrtPrice: 0n,
                    },
                ],
            }),
        };
        transactions.push(tx);

        await notify('Waiting for swap transaction confirmation...');

        // Execute transactions
        const result = await sendTransactions({ chainId, account, transactions });
        const swapMessage = result.data[result.data.length - 1];

        return toResult(result.isMultisig ? swapMessage.message : `Successfully swapped tokens on Camelot V3. ${swapMessage.message}`);
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return toResult(errorMessage, true);
    }
}
