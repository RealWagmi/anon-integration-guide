import { Address } from 'viem';
import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { SwapKind } from '@balancer/sdk';
import { formatSwapQuote, getSwapQuote } from '../helpers/swaps';
import { supportedChains } from '../constants';
import { validateTokenPositiveDecimalAmount } from '../helpers/validation';

interface Props {
    chainName: string;
    tokenInAddress: Address;
    tokenOutAddress: Address;
    humanReadableAmountIn: string;
}

/**
 * Gets a quote for a swap with exact input amount, without executing the trade.
 * Useful for price discovery and pre-trade analysis.
 *
 * @param {Object} props - The input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @param {Address} props.tokenInAddress - Address of token being sold
 * @param {Address} props.tokenOutAddress - Address of token being bought
 * @param {string} props.humanReadableAmountIn - Exact amount to sell in decimal form (e.g. "1.5" rather than "1500000000000000000")
 * @param {FunctionOptions} options - HeyAnon SDK options, including provider and notification handlers
 * @returns {Promise<FunctionReturn>} Quote details including expected output amount and price impact
 */
export async function getQuoteForSwapExactIn({ chainName, tokenInAddress, tokenOutAddress, humanReadableAmountIn }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);
    if (!validateTokenPositiveDecimalAmount(humanReadableAmountIn)) return toResult(`Invalid swap amount: ${humanReadableAmountIn}`, true);

    try {
        const quote = await getSwapQuote(
            {
                chainName,
                tokenInAddress,
                tokenOutAddress,
                humanReadableAmount: humanReadableAmountIn,
                swapKind: SwapKind.GivenIn,
            },
            options,
        );

        return toResult(formatSwapQuote(quote));
    } catch (error) {
        return toResult(`Error getting quote: ${error}`, true);
    }
}
