import { Address } from 'viem';
import { FunctionReturn, FunctionOptions } from '@heyanon/sdk';
import { SwapKind } from '@balancer/sdk';
import { getSwapQuote } from '../helpers/swaps';

interface Props {
    chainName: string;
    tokenInAddress: Address;
    tokenOutAddress: Address;
    humanReadableAmountIn: string;
}

export async function getQuoteForSwapExactIn({ chainName, tokenInAddress, tokenOutAddress, humanReadableAmountIn }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    return getSwapQuote(
        {
            chainName,
            tokenInAddress,
            tokenOutAddress,
            humanReadableAmount: humanReadableAmountIn,
            swapKind: SwapKind.GivenIn,
        },
        options,
    );
}
