import { Address, PublicClient } from 'viem';
import { FunctionOptions, FunctionReturn, getChainFromName, toResult } from '@heyanon/sdk';
import { ADDRESSES, SUPPORTED_CHAINS } from '../constants';
import { quoterAbi } from '../abis';
import { amountToWei, weiToAmount } from '../utils';

interface Props {
    chainName: string;
    tokenIn: Address;
    tokenOut: Address;
    amountOut: string;
}

export async function quoteExactOutputSingle(
    { chainName, tokenIn, tokenOut, amountOut }: Props,
    { sendTransactions, getProvider, notify }: FunctionOptions,
): Promise<FunctionReturn> {
    try {
        // Validate chain
        const chainId = getChainFromName(chainName);
        if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
        if (!SUPPORTED_CHAINS.includes(chainId)) return toResult(`Camelot V3 is not supported on ${chainName}`, true);

        await notify(`Quoting swap on Camelot V3...`);

        const provider = getProvider(chainId);

        // Convert amounts to wei
        const amountOutWei = await amountToWei(provider, tokenIn, amountOut);

        // Validate amounts
        if (amountOutWei === 0n) return toResult('Amount OUT must be greater than 0', true);

        // Get quote
        const quote = await callQuoteExactOutputSingle(chainId, provider, tokenIn, tokenOut, amountOutWei);
        const [amountInWei, feeWei] = quote.result;

        // Convert wei to amounts
        const [amountIn, fee] = await Promise.all([weiToAmount(provider, tokenIn, amountInWei), weiToAmount(provider, tokenOut, BigInt(feeWei))]);

        return toResult(`Expecting to pay ${amountIn} ${tokenIn} and ${fee} ${tokenIn} in fees`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return toResult(errorMessage, true);
    }
}

export async function callQuoteExactOutputSingle(chainId: number, provider: PublicClient, tokenIn: Address, tokenOut: Address, amountOutWei: bigint) {
    return provider.simulateContract({
        address: ADDRESSES[chainId].QUOTER_ADDRESS,
        abi: quoterAbi,
        functionName: 'quoteExactOutputSingle',
        args: [tokenIn, tokenOut, amountOutWei, 0n],
    });
}
