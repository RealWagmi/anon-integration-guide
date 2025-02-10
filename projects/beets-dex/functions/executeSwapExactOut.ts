import { Address, erc20Abi } from 'viem';
import { FunctionReturn, FunctionOptions, getChainFromName, toResult, checkToApprove, TransactionParams } from '@heyanon/sdk';
import { SwapKind } from '@balancer/sdk';
import { GetQuoteResult, getSwapQuote, buildSwapTransaction } from '../helpers/swaps';
import { DEFAULT_DEADLINE_FROM_NOW, DEFAULT_SLIPPAGE_AS_PERCENTAGE, NATIVE_TOKEN_ADDRESS, supportedChains } from '../constants';
import { validateSlippageAsPercentage, validateTokenPositiveDecimalAmount } from '../helpers/validation';
import { toHumanReadableAmount } from '../helpers/tokens';

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
    const tokenIn = quote.tokenIn;
    const tokenOut = quote.tokenOut;

    // Build the swap transaction
    const {
        transaction: swapTransaction,
        expectedAmount,
        minAmountOutOrMaxAmountIn,
    } = buildSwapTransaction({
        account,
        quote,
        slippageAsPercentage,
        deadline,
    });

    // Check token balance against max amount in (including slippage)
    const maxAmountInInWei = minAmountOutOrMaxAmountIn.amount;
    const provider = options.getProvider(chainId);
    let balance: bigint;
    if (tokenInAddress === NATIVE_TOKEN_ADDRESS) {
        balance = await provider.getBalance({
            address: account,
        });
    } else {
        balance = await provider.readContract({
            address: tokenInAddress,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [account],
        });
    }
    if (balance < maxAmountInInWei) {
        return toResult(
            `Not enough tokens: you have ${toHumanReadableAmount(balance, tokenIn.decimals)} ${tokenIn.symbol}, you need ${minAmountOutOrMaxAmountIn} ${tokenIn.symbol}`,
        );
    }

    const transactions: TransactionParams[] = [];

    // Should we approve the token spend?
    if (tokenInAddress !== NATIVE_TOKEN_ADDRESS) {
        await checkToApprove({
            args: { account, target: tokenInAddress, spender: quote.quote.to, amount: maxAmountInInWei },
            provider,
            transactions,
        });
        if (transactions.length > 0) {
            await options.notify(`Will need to approve the token spend of ${minAmountOutOrMaxAmountIn} ${tokenIn.symbol} on ${chainName}`);
        }
    }

    transactions.push(swapTransaction);

    await options.notify(
        `You are about to swap approximately ${toHumanReadableAmount(expectedAmount.amount, expectedAmount.token.decimals)} ${tokenIn.symbol} on ${chainName}` +
            ` for exactly ${humanReadableAmountOut} ${tokenOut.symbol}` +
            ` with a slippage tolerance of ${slippageAsPercentage}%` +
            ` meaning you'll spend at most ${toHumanReadableAmount(minAmountOutOrMaxAmountIn.amount, minAmountOutOrMaxAmountIn.token.decimals)} ${tokenIn.symbol}`,
    );

    await options.notify(transactions.length > 1 ? `Sending approve & swap transactions...` : 'Sending swap transaction...');
    const result = await options.sendTransactions({ chainId: getChainFromName(chainName)!, account, transactions });
    const message = result.data[result.data.length - 1].message;
    return toResult(result.isMultisig ? message : `Successfully performed swap. ${message}`);
}
