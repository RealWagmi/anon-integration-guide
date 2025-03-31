import { Address, encodeFunctionData, parseEventLogs, PublicClient } from 'viem';
import {
    checkToApprove,
    FunctionOptions,
    FunctionReturn,
    getChainFromName,
    toResult,
    TransactionParams,
} from '@heyanon/sdk';
import { ADDRESSES, DEFAULT_SLIPPAGE, PERCENTAGE_BASE, SUPPORTED_CHAINS } from '../constants';
import { algebraFactoryAbi, algebraPoolAbi, algebraPoolEventsAbi, swapRouterAbi } from '../abis';
import { callQuoteExactOutputSingle } from './quoteExactOutputSingle';
import { amountToWei, getSymbol, weiToAmount } from '../utils';

interface Props {
    chainName: string;
    account: Address;
    tokenIn: Address;
    tokenOut: Address;
    amountOut: string;
    amountInMax?: string;
    recipient?: Address;
    slippage?: number;
}

// Questions:
// How to check if user wants to swap native ETH?
// TODO: Support FeeOnTransferTokens?
export async function exactOutputSingle(
    { chainName, account, tokenIn, tokenOut, amountOut, amountInMax, recipient, slippage }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions,
): Promise<FunctionReturn> {
    try {
        // Check wallet connection
        if (!account) return toResult('Wallet not connected', true);

        // Validate chain
        const chainId = getChainFromName(chainName);
        if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
        if (!SUPPORTED_CHAINS.includes(chainId)) return toResult(`Camelot V3 is not supported on ${chainName}`, true);

        // Validate slippage
        if (slippage && (!Number.isInteger(slippage) || slippage < 0 || slippage > 300)) {
            return toResult(`Invalid slippage tolerance: ${slippage}, please provide a whole non-negative number, max 3% got ${slippage / 100} %`, true);
        }

        await notify(`Preparing to swap tokens on Camelot V3...`);

        const provider = getProvider(chainId);

        // Convert amounts to wei
        let [amountOutWei, amountInMaxWei] = await Promise.all([amountToWei(provider, tokenOut, amountOut), amountToWei(provider, tokenIn, amountInMax)]);

        // Simulate swap if amountInMax is not provided to protect from front-running
        if (!amountInMax) {
            const quoteResult = await callQuoteExactOutputSingle(chainId, provider, tokenIn, tokenOut, amountOutWei);
            amountInMaxWei = quoteResult.result[0];
        }

        // Set slippage tolerance
        let slippageMultiplier;
        if (slippage) {
            slippageMultiplier = PERCENTAGE_BASE + BigInt(slippage);
        } else {
            // Set default 0.2% slippage tolerance
            slippageMultiplier = PERCENTAGE_BASE + DEFAULT_SLIPPAGE;
        }

        amountInMaxWei = (amountInMaxWei * slippageMultiplier) / PERCENTAGE_BASE;

        // Validate amounts
        if (amountOutWei === 0n) return toResult('Amount OUT must be greater than 0', true);

        if (amountInMaxWei === 0n) return toResult('Amount IN MAX must be greater than 0', true);

        // Prepare transactions
        const transactions: TransactionParams[] = [];

        // Approvals
        await checkToApprove({
            args: {
                account,
                target: tokenIn,
                spender: ADDRESSES[chainId].SWAP_ROUTER_ADDRESS,
                amount: amountInMaxWei,
            },
            provider,
            transactions,
        });

        // Swap transaction
        const tx: TransactionParams = {
            target: ADDRESSES[chainId].SWAP_ROUTER_ADDRESS,
            data: encodeFunctionData({
                abi: swapRouterAbi,
                functionName: 'exactOutputSingle',
                args: [
                    {
                        tokenIn,
                        tokenOut,
                        fee: 0,
                        recipient: recipient ?? account,
                        deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 5), // 5 minutes from now
                        amountOut: amountOutWei,
                        amountInMaximum: amountInMaxWei,
                        limitSqrtPrice: 0n,
                    },
                ],
            }),
        };
        transactions.push(tx);

        await notify('Waiting for swap transaction confirmation...');

        // Execute transactions
        const result = await sendTransactions({ chainId, account, transactions });
        const swapMessage = result.data[result.data.length - 1];

        if (result.isMultisig) {
            return toResult(swapMessage.message);
        }

        if (!swapMessage.hash) {
            return toResult(`Tried to execute swap on Camelot V3, but failed to receive tx hash. ${swapMessage.message}`);
        }

        const receipt = await provider.getTransactionReceipt({ hash: swapMessage.hash });

        const swapEvents = parseEventLogs({
            logs: receipt.logs,
            abi: algebraPoolEventsAbi,
            eventName: 'Swap',
        });

        const pool = await getPool(chainId, provider, tokenIn, tokenOut);
        const swapEvent = swapEvents.find((log) => log.address == pool);
        if (!swapEvent) {
            return toResult(`Executed swap on Camelot V3, but couldn't verify swapped amounts. ${JSON.stringify(swapEvents)}`);
        }

        const [token0, token1] = await getToken0Token1(provider, pool!);

        const [amount0Flipped, amount1Flipped] = [BigInt(-1) * swapEvent.args.amount0, BigInt(-1) * swapEvent.args.amount1];
        const [symbol0, symbol1, amount0, amount1] = await Promise.all([getSymbol(provider, token0), getSymbol(provider, token1), weiToAmount(provider, token0, amount0Flipped), weiToAmount(provider, token1, amount1Flipped)]);

        return toResult(`Successfully swapped tokens [${amount0} ${symbol0}, ${amount1} ${symbol1}] on Camelot V3. ${swapMessage.message}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return toResult(errorMessage, true);
    }
}

async function getPool(chainId: number, provider: PublicClient, tokenA: Address, tokenB: Address): Promise<Address | undefined> {
    try {
        return await provider.readContract({
            address: ADDRESSES[chainId].ALGEBRA_FACTORY_ADDRESS,
            abi: algebraFactoryAbi,
            functionName: 'poolByPair',
            args: [tokenA, tokenB],
        });
    } catch (error) {
        return undefined;
    }
}

async function getToken0Token1(provider: PublicClient, pool: Address) {
    return await Promise.all([provider.readContract({
        address: pool,
        abi: algebraPoolAbi,
        functionName: 'token0',
        args: [],
    }), provider.readContract({
        address: pool,
        abi: algebraPoolAbi,
        functionName: 'token1',
        args: [],
    })]);
}
