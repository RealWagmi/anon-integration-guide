import { Address, erc20Abi, parseUnits, decodeEventLog, Log, formatUnits, TransactionReceipt } from 'viem';
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
        balance = await provider.getBalance({ address: account });
    } else {
        balance = await provider.readContract({
            address: tokenInAddress,
            abi: erc20Abi,
            functionName: 'balanceOf',
            args: [account],
        });
    }
    if (balance < amountInInWei) {
        return toResult(`Not enough tokens: you have ${toHumanReadableAmount(balance, tokenIn.decimals)} ${tokenIn.symbol}, you need ${humanReadableAmountIn} ${tokenIn.symbol}`);
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
        `You are about to swap on ${chainName}:\n` +
            `- Exactly ${humanReadableAmountIn} ${tokenIn.symbol}\n` +
            `- For approximately ${toHumanReadableAmount(expectedAmount.amount, expectedAmount.token.decimals)} ${tokenOut.symbol}\n` +
            `- With a slippage tolerance of ${slippageAsPercentage}%\n` +
            `- You'll receive at least ${toHumanReadableAmount(minAmountOutOrMaxAmountIn.amount, minAmountOutOrMaxAmountIn.token.decimals)} ${tokenOut.symbol}`,
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
        // spent.  For the time being we just include the
        // amount from the quote, specifying it is an
        // approximate amount.
        tokenOutAmountInWei = expectedAmount.amount;
        return toResult(
            `Successfully swapped ${formatUnits(tokenInAmountInWei, tokenIn.decimals)} ${tokenIn.symbol} for approximately ${formatUnits(tokenOutAmountInWei, tokenOut.decimals)} ${tokenOut.symbol}. ${messages.at(-1)}`,
        );
    }
    return toResult(
        `Successfully swapped ${formatUnits(tokenInAmountInWei, tokenIn.decimals)} ${tokenIn.symbol} for ${formatUnits(tokenOutAmountInWei, tokenOut.decimals)} ${tokenOut.symbol}. ${messages.at(-1)}`,
    );
}
