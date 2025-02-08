import { Address, formatUnits } from 'viem';
import { FunctionReturn, FunctionOptions, getChainFromName, toResult, TransactionParams } from '@heyanon/sdk';
import { ExactOutQueryOutput, Slippage, SwapBuildCallInput, SwapBuildOutputExactOut, SwapKind } from '@balancer/sdk';
import { GetQuoteResult, getSwapQuote, buildSwapTransaction } from '../helpers/swaps';
import { DEFAULT_DEADLINE_FROM_NOW, DEFAULT_PRECISION, DEFAULT_SLIPPAGE_AS_PERCENTAGE, supportedChains } from '../constants';
import { validateSlippageAsPercentage, validateTokenPositiveDecimalAmount } from '../helpers/validation';

interface Props {
    chainName: string;
    account: Address;
    tokenInAddress: Address;
    tokenOutAddress: Address;
    humanReadableAmountOut: string;
    slippageAsPercentage: `${number}` | null;
}

export async function executeSwapExactOut(
    { chainName, account, tokenInAddress, tokenOutAddress, humanReadableAmountOut, slippageAsPercentage }: Props,
    options: FunctionOptions,
): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);
    if (!validateTokenPositiveDecimalAmount(humanReadableAmountOut)) return toResult(`Invalid swap amount: ${humanReadableAmountOut}`, true);

    // Default values
    slippageAsPercentage = slippageAsPercentage ?? `${DEFAULT_SLIPPAGE_AS_PERCENTAGE}`;
    if (!validateSlippageAsPercentage(slippageAsPercentage)) return toResult(`Invalid slippage: ${slippageAsPercentage}`, true);
    const deadline = BigInt(Math.floor(Date.now() / 1000)) + DEFAULT_DEADLINE_FROM_NOW;

    // Get the quote for the swap
    let quote: GetQuoteResult;
    try {
        quote = await getSwapQuote(
            {
                chainName,
                tokenInAddress,
                tokenOutAddress,
                humanReadableAmount: humanReadableAmountOut,
                swapKind: SwapKind.GivenOut,
            },
            options,
        );
    } catch (error) {
        return toResult(`Error getting quote: ${error}`, true);
    }

    // Build the swap transaction
    const { transactions, minAmountOutOrMaxAmountIn, expectedAmount, tokenIn, tokenOut } = buildSwapTransaction({
        account,
        quote,
        slippageAsPercentage,
        deadline,
    });

    await options.notify(
        `You are about to swap approximately ${expectedAmount} ${tokenIn.symbol} on ${chainName}` +
            ` for exactly ${humanReadableAmountOut} ${tokenOut.symbol}` +
            ` with a slippage tolerance of ${slippageAsPercentage}%` +
            ` meaning you'll pay maximum ${minAmountOutOrMaxAmountIn} ${tokenIn.symbol}`,
    );

    await options.notify('Sending transaction...');
    const result = await options.sendTransactions({ chainId: getChainFromName(chainName)!, account, transactions });
    const message = result.data[result.data.length - 1].message;
    return toResult(result.isMultisig ? message : `Successfully performed swap. ${message}`);
}
