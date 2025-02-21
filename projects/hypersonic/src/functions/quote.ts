import { FunctionReturn, toResult } from '@heyanon/sdk';
import { formatUnits } from 'viem';
import axios from 'axios';
import { validateAndGetTokenDetails } from '../utils';

interface Props {
    chainName: string;
    inToken: string;
    outToken: string;
    inAmount: string;
}

/**
 * Get quote for swapping tokens on Hypersonic DEX aggregator.
 * 
 * @param props - Quote parameters including tokens and amount
 * @param options - System tools for blockchain interactions
 * @returns Quote result with expected output amount and route
 */
export async function quote({ chainName, inToken, outToken, inAmount }: Props): Promise<FunctionReturn> {
    // Validate input token
    const inTokenDetails = validateAndGetTokenDetails({ chainName, tokenSymbol: inToken });
    if (!inTokenDetails.success) {
        return toResult(inTokenDetails.errorMessage, true);
    }

    // Validate output token
    const outTokenDetails = validateAndGetTokenDetails({ chainName, tokenSymbol: outToken });
    if (!outTokenDetails.success) {
        return toResult(outTokenDetails.errorMessage, true);
    }

    try {
        // Get quote from Hypersonic API
        const response = await axios.post(
            'https://api.hypersonic.exchange/v1/quote',
            {
                chainId: inTokenDetails.data.chainId,
                inToken: inTokenDetails.data.tokenAddress,
                outToken: outTokenDetails.data.tokenAddress,
                inAmount: inAmount,
                slippage: 2.5 // Using 2.5% slippage - recommended for good surfing Sonic speed 💥
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );

        if (!response.data.success) {
            return toResult(`Failed to get quote: ${response.data.error || 'Unknown error'}`, true);
        }

        const quoteData = response.data.data;

        return toResult(
            `Quote for ${formatUnits(BigInt(inAmount), quoteData.inDecimals)} ${inToken} to ${outToken}:\n` +
            `Expected output: ${formatUnits(quoteData.outAmount, quoteData.outDecimals)} ${outToken}\n` +
            `Minimum received: ${formatUnits(quoteData.minReceived, quoteData.outDecimals)} ${outToken}\n`
        );

    } catch (e) {
        return toResult(
            `Failed to fetch quote: ${e instanceof Error ? e.message : 'Unknown error'}`,
            true
        );
    }
}