import { Address, formatUnits } from 'viem';
import { FunctionReturn, FunctionOptions, getChainFromName, toResult, TransactionParams } from '@heyanon/sdk';
import { ExactInQueryOutput, Slippage, SwapBuildCallInput, SwapBuildOutputExactIn, SwapKind } from '@balancer/sdk';
import { GetQuoteResult, getSwapQuote } from '../helpers/swaps';
import { DEFAULT_DEADLINE_FROM_NOW, DEFAULT_PRECISION, DEFAULT_SLIPPAGE_AS_PERCENTAGE, supportedChains } from '../constants';
import { validateSlippageAsPercentage, validateTokenPositiveDecimalAmount } from '../helpers/validation';

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

    const notify = options.notify;
    const sendTransactions = options.sendTransactions;

    // Default value for slippage if not provided
    if (!slippageAsPercentage) {
        slippageAsPercentage = `${DEFAULT_SLIPPAGE_AS_PERCENTAGE}`;
    }
    if (!validateSlippageAsPercentage(slippageAsPercentage)) return toResult(`Invalid slippage: ${slippageAsPercentage}`, true);

    // Calculate the deadline from now, in seconds
    const deadline = BigInt(Math.floor(Date.now() / 1000)) + DEFAULT_DEADLINE_FROM_NOW;

    // TODO: check if the user has enough balance to cover the swap

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

    // Extract quote and swap objects
    const { quote: _q, swap, tokenIn, tokenOut } = quote;
    const q = _q as ExactInQueryOutput;

    // TODO: Allow the user to send ETH, for now only WETH is supported
    const wethIsEth = false;

    // Build the call input for the swap transaction
    // In v2 the sender/recipient can be set, in v3 it is always the msg.sender
    // Source: https://docs.balancer.fi/integration-guides/swapping/swaps-with-sor-sdk.html
    let buildInput: SwapBuildCallInput;
    if (swap.protocolVersion === 2) {
        buildInput = {
            slippage: Slippage.fromPercentage(slippageAsPercentage),
            deadline,
            queryOutput: q,
            wethIsEth,
            sender: account as `0x${string}`,
            recipient: account as `0x${string}`,
        };
    } else {
        buildInput = {
            slippage: Slippage.fromPercentage(slippageAsPercentage),
            deadline,
            queryOutput: q,
            wethIsEth,
        };
    }

    const callData = swap.buildCall(buildInput) as SwapBuildOutputExactIn;
    const amountOutHuman = formatUnits(callData.minAmountOut.amount, tokenOut.decimals);

    await notify(`You are about to swap ${humanReadableAmountIn} ${tokenIn.symbol} for at least ${amountOutHuman} ${tokenOut.symbol} on ${chainName}`);
    await notify(`Slippage tolerance: ${slippageAsPercentage}%`);
    await notify(`Recipient: ${account}`);

    const transactions: TransactionParams[] = [];
    const tx: TransactionParams = {
        target: callData.to,
        data: callData.callData,
    };
    transactions.push(tx);

    await notify('Sending transaction...');
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1].message;
    return toResult(result.isMultisig ? message : `Successfully performed swap. ${message}`);
}
