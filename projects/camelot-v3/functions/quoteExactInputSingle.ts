import { Address, PublicClient } from 'viem';
import { FunctionOptions, FunctionReturn, getChainFromName, toResult } from '@heyanon/sdk';
import { ADDRESSES, SUPPORTED_CHAINS } from '../constants';
import { quoterAbi } from '../abis';
import { amountToWei, weiToAmount } from '../utils';

interface Props {
    chainName: string;
    tokenIn: Address;
    tokenOut: Address;
    amountIn: string;
}

export async function quoteExactInputSingle({ chainName, tokenIn, tokenOut, amountIn }: Props, { getProvider, notify }: FunctionOptions): Promise<FunctionReturn> {
    try {
        // Validate chain
        const chainId = getChainFromName(chainName);
        if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
        if (!SUPPORTED_CHAINS.includes(chainId)) return toResult(`Camelot V3 is not supported on ${chainName}`, true);

        await notify(`Quoting swap on Camelot V3...`);

        const provider = getProvider(chainId);

        // Convert amounts to wei
        const amountInWei = await amountToWei(provider, tokenIn, amountIn);

        // Validate amounts
        if (amountInWei === 0n) return toResult('Amount IN must be greater than 0', true);

        // Get quote
        const quote = await callQuoteExactInputSingle(chainId, provider, tokenIn, tokenOut, amountInWei);
        const [amountOutWei, feeWei] = quote.result;

        // Convert wei to amounts
        const [amountOut, fee] = await Promise.all([weiToAmount(provider, tokenOut, amountOutWei), weiToAmount(provider, tokenIn, BigInt(feeWei))]);

        return toResult(`Expecting to receive ${amountOut} ${tokenOut} and paying ${fee} ${tokenIn} in fees`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return toResult(errorMessage, true);
    }
}

export async function callQuoteExactInputSingle(chainId: number, provider: PublicClient, tokenIn: Address, tokenOut: Address, amountInWei: bigint) {
    return provider.simulateContract({
        address: ADDRESSES[chainId].QUOTER_ADDRESS,
        abi: quoterAbi,
        functionName: 'quoteExactInputSingle',
        args: [tokenIn, tokenOut, amountInWei, 0n],
    });
}
