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
}

/**
 * Returns the quote amount of the most optimal route from a token to a token
 * @param props - The function parameters
 */
export async function quote({ chainName, tokenIn, tokenOut, amountIn, account }: Props, { sendTransactions, notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
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
            receiver: account,
            spender: account,
        };

        if (!isAddress(params.receiver)) {
            return toResult('Receiver is not an address', true);
        }
        if (!isAddress(params.spender)) {
            return toResult('Spender is not an address', true);
        }

        await notify('Fetching the most optimal route from Enso API');
        const quote = await ensoClient.getRouterData(params);
        return toResult(`For ${amountIn} ${tokenInData.symbol} you will get ${quote.amountOut} ${tokenOutData.symbol}.`);
    } catch (e) {
        if (axios.isAxiosError(e)) {
            return toResult(`API error: ${e.message}`, true);
        }
        return toResult(`Unknown error when fetching route from Enso API`, true);
    }
}
