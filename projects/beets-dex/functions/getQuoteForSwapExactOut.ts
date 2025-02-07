import { Address } from 'viem';
import { FunctionReturn, FunctionOptions } from '@heyanon/sdk';
import { SwapKind } from '@balancer/sdk';
import { getSwapQuote } from '../helpers/swaps';

interface Props {
    chainName: string;
    tokenInAddress: Address;
    tokenOutAddress: Address;
    humanReadableAmountOut: string;
}

export async function getQuoteForSwapExactOut({ chainName, tokenInAddress, tokenOutAddress, humanReadableAmountOut }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    return getSwapQuote(
        {
            chainName,
            tokenInAddress,
            tokenOutAddress,
            humanReadableAmount: humanReadableAmountOut,
            swapKind: SwapKind.GivenOut,
        },
        options,
    );
}
