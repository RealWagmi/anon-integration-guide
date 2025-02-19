import { Address, erc20Abi, formatUnits, parseUnits, TransactionReceipt } from 'viem';
import { FunctionReturn, FunctionOptions, getChainFromName, toResult, checkToApprove, TransactionParams } from '@heyanon/sdk';
import { SwapKind } from '@balancer/sdk';
import { GetQuoteResult, getSwapQuote, buildSwapTransaction } from '../helpers/swaps';
import { DEFAULT_DEADLINE_FROM_NOW, DEFAULT_SLIPPAGE_AS_PERCENTAGE, NATIVE_TOKEN_ADDRESS, supportedChains } from '../constants';
import { validatePercentage, validateTokenPositiveDecimalAmount } from '../helpers/validation';
import { toHumanReadableAmount, getTokenTransferAmounts } from '../helpers/tokens';
import { sendTransactionsAndWaitForReceipts } from '../helpers/viem';

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
    if (!validatePercentage(slippageAsPercentage)) return toResult(`Invalid slippage: ${slippageAsPercentage}`, true);
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
    const humanReadableMaxAmountIn = toHumanReadableAmount(maxAmountInInWei, minAmountOutOrMaxAmountIn.token.decimals);
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
            `Not enough tokens: you have ${toHumanReadableAmount(balance, tokenIn.decimals)} ${tokenIn.symbol}, you need ${humanReadableMaxAmountIn} ${tokenIn.symbol}`,
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
            await options.notify(`Will need to approve the token spend of ${humanReadableMaxAmountIn} ${tokenIn.symbol} on ${chainName}`);
        }
    }

    transactions.push(swapTransaction);

    await options.notify(
        `You are about to swap on ${chainName}:\n` +
            `- Approximately ${toHumanReadableAmount(expectedAmount.amount, expectedAmount.token.decimals)} ${tokenIn.symbol}\n` +
            `- For exactly ${humanReadableAmountOut} ${tokenOut.symbol}\n` +
            `- With a slippage tolerance of ${slippageAsPercentage}%\n` +
            `- You'll spend at most ${humanReadableMaxAmountIn} ${tokenIn.symbol}`,
    );

    // Send the transactions and wait for confirmation
    await options.notify(transactions.length > 1 ? `Sending approve & swap transactions...` : 'Sending swap transaction...');
    const { hashes, messages, receipts } = await sendTransactionsAndWaitForReceipts({
        publicClient: provider,
        transactions,
        sendTransactions: options.sendTransactions,
        account,
        chainId,
    });

    if (transactions.length > 1) {
        options.notify(`Approval transaction sent with hash: ${hashes[0]}`);
    }
    options.notify(`Swap transaction sent with hash: ${hashes.at(-1)}`);

    // Return summary of the swap with actual values
    const swapReceipt = receipts.at(-1) as TransactionReceipt;
    let { tokenInAmountInWei, tokenOutAmountInWei } = getTokenTransferAmounts(swapReceipt, account, tokenInAddress, tokenOutAddress);
    if (tokenInAddress === NATIVE_TOKEN_ADDRESS) {
        tokenInAmountInWei = transactions.at(-1)?.value as bigint;
    }
    if (tokenOutAddress === NATIVE_TOKEN_ADDRESS) {
        // TODO: Compute the received amount of native tokens.
        // This is tricky because we need to compute the gas
        // spent. For the time being we just show what the
        // user asked for, since this is an exactOut swap.
        tokenOutAmountInWei = parseUnits(humanReadableAmountOut, tokenOut.decimals);
    }
    return toResult(
        `Successfully swapped ${formatUnits(tokenInAmountInWei, tokenIn.decimals)} ${tokenIn.symbol} for ${formatUnits(tokenOutAmountInWei, tokenOut.decimals)} ${tokenOut.symbol}. ${messages.at(-1)}`,
    );
}
