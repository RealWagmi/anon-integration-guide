import { Address, erc20Abi, parseUnits } from 'viem';
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
    humanReadableAmountIn: string;
    slippageAsPercentage: `${number}` | null;
}

export async function executeSwapExactIn(
    { chainName, account, tokenInAddress, tokenOutAddress, humanReadableAmountIn, slippageAsPercentage }: Props,
    options: FunctionOptions,
): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Beets protocol is not supported on ${chainName}`, true);
    if (!validateTokenPositiveDecimalAmount(humanReadableAmountIn)) return toResult(`Invalid swap amount: ${humanReadableAmountIn}`, true);

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
                humanReadableAmount: humanReadableAmountIn,
                swapKind: SwapKind.GivenIn,
            },
            options,
        );
    } catch (error) {
        return toResult(`Error getting quote: ${error}`, true);
    }
    const tokenIn = quote.tokenIn;
    const tokenOut = quote.tokenOut;

    // Check token balance
    const amountInInWei = parseUnits(humanReadableAmountIn, tokenIn.decimals);
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
    if (balance < amountInInWei) {
        return toResult(`Not enough tokens: has ${toHumanReadableAmount(balance, tokenIn.decimals)} ${tokenIn.symbol}, needs ${humanReadableAmountIn} ${tokenIn.symbol}`);
    }

    const transactions: TransactionParams[] = [];

    // Should we approve the token spend?
    if (tokenInAddress !== NATIVE_TOKEN_ADDRESS) {
        await checkToApprove({
            args: { account, target: tokenInAddress, spender: quote.quote.to, amount: amountInInWei },
            provider,
            transactions,
        });
        if (transactions.length > 0) {
            await options.notify(`Will need to approve the token spend of ${humanReadableAmountIn} ${tokenIn.symbol} on ${chainName}`);
        }
    }

    // Build the swap transaction
    const { transaction, minAmountOutOrMaxAmountIn, expectedAmount } = buildSwapTransaction({
        account,
        quote,
        slippageAsPercentage,
        deadline,
    });
    transactions.push(transaction);

    await options.notify(
        `You are about to swap exactly ${humanReadableAmountIn} ${tokenIn.symbol} on ${chainName}` +
            ` for approximately ${toHumanReadableAmount(expectedAmount.amount, expectedAmount.token.decimals)} ${tokenOut.symbol}` +
            ` with a slippage tolerance of ${slippageAsPercentage}%` +
            ` meaning you'll receive at least ${toHumanReadableAmount(minAmountOutOrMaxAmountIn.amount, minAmountOutOrMaxAmountIn.token.decimals)} ${tokenOut.symbol}`,
    );

    await options.notify(transactions.length > 1 ? `Sending approve & swap transactions...` : 'Sending swap transaction...');
    const result = await options.sendTransactions({ chainId: getChainFromName(chainName)!, account, transactions });
    const message = result.data[result.data.length - 1].message;
    return toResult(result.isMultisig ? message : `Successfully performed swap. ${message}`);
}
