import { FunctionReturn, toResult, getChainFromName, FunctionOptions, TransactionParams, checkToApprove } from '@heyanon/sdk';
import { ENSO_API_TOKEN, ENSO_ETH, supportedChains } from '../constants';
import axios from 'axios';
import { Address, Hex, isAddress } from 'viem';
import { EnsoClient, RouteParams } from '@ensofinance/sdk';

interface Props {
    chainName: string;
    account: Address;
    tokenIn: Address;
    tokenOut: Address;
    amountIn: string;
    amountOut?: string;
    receiver?: Address;
    spender?: Address;
    slippage?: number;
    fee?: number;
    feeReceiver?: Address;
}

/**
 * Best route from a token to a token
 * @param props - The function parameters
 */
export async function route(
    { chainName, tokenIn, tokenOut, amountIn, spender, receiver, slippage, amountOut, account, fee, feeReceiver }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions,
): Promise<FunctionReturn> {
    if (!account) return toResult('No account provided', true);
    if (!tokenIn) return toResult('No tokenIn provided', true);
    if (!tokenOut) return toResult('No tokenOut provided', true);
    if (!amountIn) return toResult('No amountIn provided', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Enso is not supported on ${chainName}`, true);

    const params: RouteParams = {
        chainId,
        tokenIn,
        tokenOut,
        amountIn,
        fromAddress: account,
        receiver: receiver || account,
        spender: spender || account,
    };

    if (!isAddress(params.receiver)) {
        return toResult('Receiver is not an address', true);
    }
    if (!isAddress(params.spender)) {
        return toResult('Spender is not an address', true);
    }

    if (amountOut) {
        params.minAmountOut = amountOut;
    }
    if (slippage) {
        if (slippage > 10_000 || slippage < 0) {
            return toResult('Slippage is outside of 0-10000 range', true);
        }
        params.slippage = slippage;
    }
    if (fee) {
        if (fee > 100 || fee < 0) {
            return toResult('Fee is outside of 0-100 range', true);
        }
        params.fee = fee;
    }
    if (feeReceiver) {
        if (!isAddress(feeReceiver)) {
            return toResult('Fee receiver is not an address', true);
        }
        params.feeReceiver = feeReceiver;
    }

    try {
        const ensoClient = new EnsoClient({ apiKey: ENSO_API_TOKEN });
        await notify('Fetching the best route from Enso API');
        const routeData = await ensoClient.getRouterData(params);

        const provider = getProvider(chainId);
        const transactions: TransactionParams[] = [];

        if (tokenIn.toLowerCase() !== ENSO_ETH.toLowerCase()) {
            await checkToApprove({
                args: {
                    account,
                    target: tokenIn,
                    spender: routeData.tx.to,
                    amount: BigInt(amountIn),
                },
                provider,
                transactions,
            });
        }

        const tx: TransactionParams = { target: routeData.tx.to, data: routeData.tx.data as Hex, value: BigInt(routeData.tx.value) };
        transactions.push(tx);

        const result = await sendTransactions({ chainId, account, transactions });
        const depositMessage = result.data[result.data.length - 1];

        return toResult(result.isMultisig ? depositMessage.message : `Successfully executed route. ${depositMessage.message}`);
    } catch (e) {
        if (axios.isAxiosError(e)) {
            return toResult(`API error: ${e.message}`, true);
        }
        return toResult(`Unknown error when fetching route from Enso API`, true);
    }
}
