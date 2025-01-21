import { FunctionReturn, toResult, getChainFromName, FunctionOptions, TransactionParams, checkToApprove } from '@heyanon/sdk';
import { ENSO_API, ENSO_API_TOKEN, ENSO_ETH, supportedChains } from '../constants';
import axios from 'axios';
import { Address, Hex, isAddress } from 'viem';

// probably we should leave: chainId, fromAddress, receiver, spender, amountIn, amountOut, slippage, fee, feeReceiver, tokenIn, tokenOut
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

interface EnsoHop {
    tokenIn: string[];
    tokenOut: string[];
    protocol: string;
    action: string;
    primary: string;
    internalRoutes: string[];
}

interface EnsoApiRouteResponse {
    gas: string;
    priceImpact: number | null;
    amountOut: string | string[];
    feeAmount?: string[];
    createdAt: number;
    tx: {
        data: Hex;
        to: Address;
        from: Address;
        value: string;
    };
    route: EnsoHop[];
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

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Enso is not supported on ${chainName}`, true);

    const params = new URLSearchParams({
        chainId: chainId.toString(),
        tokenIn,
        tokenOut,
        amountIn,
        fromAddress: account,
    });

    if (receiver) {
        if (!isAddress(receiver)) {
            return toResult('Receiver is not an address', true);
        }
        params.set('receiver', receiver);
    }
    if (spender) {
        if (!isAddress(spender)) {
            return toResult('Spender is not an address', true);
        }
        params.set('spender', spender);
    }
    if (amountOut) params.set('amountOut', amountOut);
    if (slippage) {
        if (slippage > 10_000 || slippage < 0) {
            return toResult('Slippage is outside of 0-10000 range', true);
        }
        params.set('slippage', slippage.toString());
    }
    if (fee) {
        if (fee > 100 || fee < 0) {
            return toResult('Fee is outside of 0-100 range', true);
        }
        params.set('fee', fee.toString());
    }
    if (feeReceiver) {
        if (!isAddress(feeReceiver)) {
            return toResult('Fee receiver is not an address', true);
        }
        params.set('feeReceiver', feeReceiver);
    }

    try {
        const url = `${ENSO_API}/shortcuts/route?${params}`;

        await notify('Fetching the best route from Enso API');
        const res = await axios.get<EnsoApiRouteResponse>(url, { headers: { Authorization: `Bearer ${ENSO_API_TOKEN}` } });

        const provider = getProvider(chainId);
        const transactions: TransactionParams[] = [];

        if (tokenIn !== ENSO_ETH) {
            await checkToApprove({
                args: {
                    account,
                    target: tokenIn,
                    spender: res.data.tx.to,
                    amount: BigInt(amountIn),
                },
                provider,
                transactions,
            });
        }

        const tx: TransactionParams = { target: res.data.tx.to, data: res.data.tx.data, value: BigInt(res.data.tx.value) };
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
