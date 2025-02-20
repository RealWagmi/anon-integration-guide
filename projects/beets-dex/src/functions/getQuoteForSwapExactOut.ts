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
