import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { Address } from 'viem';
import { DEBRIDGE_API_URL } from '../constants';

interface Props {
    srcChainId: string;
    srcChainTokenIn: string;
    srcChainTokenInAmount: string;
    dstChainId: string;
    dstChainTokenOut: string;
    account: Address;
    slippage?: string;
    prependOperatingExpenses?: boolean;
}

interface QuoteResponse {
    tx: {
        data: string;
        to: string;
        value: string;
    };
    estimation: {
        srcChainTokenIn: {
            amount: string;
            tokenAddress: string;
            decimals: number;
            symbol: string;
        };
        dstChainTokenOut: {
            amount: string;
            tokenAddress: string;
            decimals: number;
            symbol: string;
        };
        fees: {
            srcChainTokenIn: string;
            dstChainTokenOut: string;
        };
    };
}

/**
 * Get a quote for bridging tokens between chains.
 * Use getTokenInfo first to get correct token addresses.
 * 
 * @param props - The function parameters
 * @param props.srcChainId - Source chain ID (e.g., '1' for Ethereum)
 * @param props.srcChainTokenIn - Token address on source chain (0x0 for native token)
 * @param props.srcChainTokenInAmount - Amount in base units (e.g., wei)
 * @param props.dstChainId - Destination chain ID
 * @param props.dstChainTokenOut - Token address on destination chain
 * @param props.account - User's wallet address
 * @param props.slippage - Optional slippage percentage (0-100)
 * @param props.prependOperatingExpenses - Whether to include operating expenses
 * @param tools - System tools for blockchain interactions
 * @returns Quote information including fees and estimated amounts
 */
export async function getBridgeQuote(
    {
        srcChainId,
        srcChainTokenIn,
        srcChainTokenInAmount,
        dstChainId,
        dstChainTokenOut,
        account,
        slippage = "auto",
        prependOperatingExpenses = true,
    }: Props,
    { notify }: FunctionOptions
): Promise<FunctionReturn> {
    try {
        // Check wallet connection
        if (!account) return toResult('Wallet not connected', true);

        await notify('Getting bridge quote...');

        // Validate chain IDs
        if (srcChainId === dstChainId) {
            return toResult('Source and destination chains must be different', true);
        }

        // Construct URL based on whether it's same-chain or cross-chain
        const isSameChain = srcChainId === dstChainId;
        const url = isSameChain
            ? `${DEBRIDGE_API_URL}/chain/transaction?${new URLSearchParams({
                chainId: srcChainId,
                tokenIn: srcChainTokenIn,
                tokenInAmount: srcChainTokenInAmount,
                tokenOut: dstChainTokenOut,
                tokenOutRecipient: account,
                slippage: slippage?.toString() || "auto",
                affiliateFeePercent: "0",
            })}`
            : `${DEBRIDGE_API_URL}/dln/order/create-tx?${new URLSearchParams({
                srcChainId,
                srcChainTokenIn,
                srcChainTokenInAmount,
                dstChainId,
                dstChainTokenOut,
                dstChainTokenOutAmount: "auto",
                prependOperatingExpenses: prependOperatingExpenses.toString(),
                additionalTakerRewardBps: "0",
            })}`;

        const response = await fetch(url);
        if (!response.ok) {
            const text = await response.text();
            return toResult(`Failed to get bridge quote: ${text}`, true);
        }

        const data = await response.json() as QuoteResponse;
        if ('error' in data) {
            return toResult(`API Error: ${data.error}`, true);
        }

        // Format the response in a user-friendly way
        const { estimation } = data;
        const sourceToken = estimation.srcChainTokenIn;
        const destToken = estimation.dstChainTokenOut;
        
        const formattedQuote = `Bridge Quote:
Source: ${sourceToken.amount} ${sourceToken.symbol} (${sourceToken.tokenAddress})
Destination: ${destToken.amount} ${destToken.symbol} (${destToken.tokenAddress})

Fees:
- Source Chain: ${estimation.fees.srcChainTokenIn} ${sourceToken.symbol}
- Destination Chain: ${estimation.fees.dstChainTokenOut} ${destToken.symbol}

Transaction Details:
- To: ${data.tx.to}
- Value: ${data.tx.value}`;

        return toResult(formattedQuote);
    } catch (error) {
        return toResult(`Failed to get bridge quote: ${error}`, true);
    }
}
