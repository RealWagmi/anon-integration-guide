import { FunctionReturn, toResult, getChainFromName, FunctionOptions, TransactionParams, checkToApprove } from '@heyanon/sdk';
import { ENSO_API_TOKEN, ENSO_ETH, supportedChains, TRANSFER_EVENT_SIG } from '../constants';
import axios from 'axios';
import { Address, formatUnits, Hex, isAddress, parseUnits } from 'viem';
import { EnsoClient, RouteParams } from '@ensofinance/sdk';
import { buildRoutePath } from '../utils';

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
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Enso is not supported on ${chainName}`, true);

    try {
        const ensoClient = new EnsoClient({ apiKey: ENSO_API_TOKEN });
        const tokenInRes = await ensoClient.getTokenData({ chainId, address: tokenIn });
        if (tokenInRes.data.length === 0 || typeof tokenInRes.data[0].decimals !== 'number') {
            return toResult(`Token ${tokenIn} is not supported`, true);
        }
        const tokenInData = tokenInRes.data[0];
        const amountInWei = parseUnits(amountIn, tokenInData.decimals);

        const tokenOutRes = await ensoClient.getTokenData({ chainId, address: tokenOut, includeMetadata: true });
        if (tokenOutRes.data.length === 0 || typeof tokenOutRes.data[0].decimals !== 'number') {
            return toResult(`Token ${tokenOut} is not supported`, true);
        }

        const tokenOutData = tokenOutRes.data[0];

        const params: RouteParams = {
            chainId,
            tokenIn,
            tokenOut,
            amountIn: amountInWei.toString(),
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
            const amountOutWei = parseUnits(amountOut, tokenOutData.decimals);
            params.minAmountOut = amountOutWei.toString();
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

        await notify('Fetching the best route from Enso API');
        const routeData = await ensoClient.getRouterData(params);

        const routePathString = buildRoutePath(routeData.route);
        await notify(`Found route:\n  ${routePathString}\nExpected amount out: ${formatUnits(BigInt(routeData.amountOut), tokenOutData.decimals)} ${tokenOutData.symbol}`);

        const provider = getProvider(chainId);
        const transactions: TransactionParams[] = [];

        if (tokenIn.toLowerCase() !== ENSO_ETH.toLowerCase()) {
            await checkToApprove({
                args: {
                    account,
                    target: tokenIn,
                    spender: routeData.tx.to,
                    amount: amountInWei,
                },
                provider,
                transactions,
            });
        }

        const tx: TransactionParams = { target: routeData.tx.to, data: routeData.tx.data as Hex, value: BigInt(routeData.tx.value) };
        transactions.push(tx);

        const result = await sendTransactions({ chainId, account, transactions });
        const routeRes = result.data[result.data.length - 1];

        if (result.isMultisig) return toResult(routeRes.message);

        const routeReceipt = await provider.getTransactionReceipt({ hash: routeRes.hash });

        // Find the last transfer that was sent to receiver
        for (let i = routeReceipt.logs.length - 1; i >= 0; i--) {
            const log = routeReceipt.logs[i];
            if (log.address.toLowerCase() !== tokenOut.toLowerCase() || log.topics[0]?.toLowerCase() !== TRANSFER_EVENT_SIG || log.topics[2] === undefined) continue;

            const toAddress = '0x' + log.topics[2].slice(-40).toLowerCase();
            if (toAddress === params.receiver.toLowerCase()) {
                const amountOutEvent = formatUnits(BigInt(log.data), tokenOutData.decimals);
                return toResult(
                    `Route successfully executed: spent ${amountIn} ${tokenInData.symbol}, received ${amountOutEvent} ${tokenOutData.symbol}. Message: ${routeRes.message}`,
                );
            }
        }

        // NOTE: fallback if Transfer event to receiver was not found
        return toResult(`Route successfully executed: spent ${amountIn} ${tokenInData.symbol}. Message: ${routeRes.message}`);
    } catch (e) {
        if (axios.isAxiosError(e)) {
            return toResult(`API error: ${e.message}`, true);
        }
        return toResult(`Unknown error when fetching route from Enso API`, true);
    }
}
