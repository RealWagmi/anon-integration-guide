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
    humanReadableAmountOut: string;
}

/**
 * Gets a quote for a swap targeting an exact output amount, without executing the trade.
 * Useful for price discovery and pre-trade analysis.
 *
 * @param {Object} props - The input parameters
 * @param {string} props.chainName - Name of the blockchain network
 * @param {Address} props.tokenInAddress - Address of token being sold
 * @param {Address} props.tokenOutAddress - Address of token being bought
 * @param {string} props.humanReadableAmountOut - Exact amount to receive in decimal form (e.g. "1.5" rather than "1500000000000000000")
 * @param {FunctionOptions} options - HeyAnon SDK options, including provider and notification handlers
 * @returns {Promise<FunctionReturn>} Quote details including required input amount and price impact
 */
export async function getQuoteForSwapExactOut({ chainName, tokenInAddress, tokenOutAddress, humanReadableAmountOut }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);
    if (!validateTokenPositiveDecimalAmount(humanReadableAmountOut)) return toResult(`Invalid swap amount: ${humanReadableAmountOut}`, true);

    try {
        const quote = await getSwapQuote(
            {
                chainName,
                tokenInAddress,
                tokenOutAddress,
                humanReadableAmount: humanReadableAmountOut,
                swapKind: SwapKind.GivenOut,
            },
            options,
        );

        return toResult(formatSwapQuote(quote));
    } catch (error) {
        return toResult(`Error getting quote: ${error}`, true);
    }
}
