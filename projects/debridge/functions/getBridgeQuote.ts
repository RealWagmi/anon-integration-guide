import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { Address } from 'viem';
import axios from 'axios';
import { DEBRIDGE_API_URL } from '../constants';

interface Props {
    srcChainId: string;
    srcChainTokenIn: string;
    srcChainTokenInAmount: string;
    dstChainId: string;
    dstChainTokenOut: string;
    account: Address;
    recipient: Address;
    slippage?: string;
    prependOperatingExpenses?: boolean;
}

// For same-chain swaps
interface TokenInfo {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    amount: string;
    minAmount?: string;
}

interface SameChainResponse {
    tokenIn: TokenInfo;
    tokenOut: TokenInfo;
    slippage: number;
    recommendedSlippage: number;
    tx: {
        data: string;
        to: string;
        value: string;
    };
}

// For cross-chain transfers
interface CrossChainResponse {
    estimation: {
        srcChainTokenIn: {
            address: string;
            chainId: number;
            decimals: number;
            name: string;
            symbol: string;
            amount: string;
            approximateOperatingExpense?: string;
            mutatedWithOperatingExpense?: boolean;
            approximateUsdValue?: number;
            originApproximateUsdValue?: number;
        };
        srcChainTokenOut?: {
            address: string;
            chainId: number;
            decimals: number;
            name: string;
            symbol: string;
            amount: string;
            maxRefundAmount?: string;
            approximateUsdValue?: number;
        };
        dstChainTokenOut: {
            name: string;
            symbol: string;
            chainId: number;
            address: string;
            decimals: number;
            amount: string;
            recommendedAmount?: string;
            maxTheoreticalAmount?: string;
            approximateUsdValue?: number;
            recommendedApproximateUsdValue?: number;
            maxTheoreticalApproximateUsdValue?: number;
        };
        fees: {
            srcChainTokenIn: string;
            dstChainTokenOut: string;
        };
        costsDetails?: Array<{
            chain: string;
            tokenIn: string;
            tokenOut: string;
            amountIn: string;
            amountOut: string;
            type: string;
            payload?: any;
        }>;
        recommendedSlippage?: number;
    };
    tx: {
        allowanceTarget?: string;
    };
    prependedOperatingExpenseCost?: string;
    order?: {
        approximateFulfillmentDelay: number;
        salt: number;
        metadata: string;
    };
    orderId?: string;
    fixFee?: string;
    userPoints?: number;
    integratorPoints?: number;
}

type QuoteResponse = CrossChainResponse | SameChainResponse;

/**
 * Get a quote for bridging tokens between chains or swapping on the same chain.
 * Use getTokenInfo first to get correct token addresses.
 * 
 * @param props - The function parameters
 * @param props.srcChainId - Source chain ID (e.g., '1' for Ethereum)
 * @param props.srcChainTokenIn - Token address on source chain (0x0 for native token)
 * @param props.srcChainTokenInAmount - Amount in base units (e.g., wei)
 * @param props.dstChainId - Destination chain ID
 * @param props.dstChainTokenOut - Token address on destination chain
 * @param props.account - User's wallet address
 * @param props.recipient - Recipient's wallet address
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
        recipient,
        slippage = "auto",
        prependOperatingExpenses = true,
    }: Props,
    { notify }: FunctionOptions
): Promise<FunctionReturn> {
    try {
        // Check wallet connection
        if (!account) return toResult('Wallet not connected', true);

        await notify('Getting bridge quote...');

        // Construct URL based on whether it's same-chain or cross-chain
        const isSameChain = srcChainId === dstChainId;
        const params = isSameChain
            ? {
                chainId: srcChainId,
                tokenIn: srcChainTokenIn,
                tokenInAmount: srcChainTokenInAmount,
                tokenOut: dstChainTokenOut,
                tokenOutRecipient: recipient,
                slippage: slippage?.toString() || "auto",
                affiliateFeePercent: "0",
            }
            : {
                srcChainId,
                srcChainTokenIn,
                srcChainTokenInAmount,
                dstChainId,
                dstChainTokenOut,
                dstChainTokenOutRecipient: recipient,
                dstChainTokenOutAmount: "auto",
                prependOperatingExpenses: prependOperatingExpenses.toString(),
                additionalTakerRewardBps: "0",
            };

        const url = isSameChain
            ? `${DEBRIDGE_API_URL}/chain/transaction`
            : `${DEBRIDGE_API_URL}/dln/order/create-tx`;

        try {
            const response = await axios.get<QuoteResponse>(url, { params });
            const data = response.data;

            // Format the response in a user-friendly way, keeping it concise
            let formattedQuote = 'Bridge Quote Summary:\n';

            if (isSameChain) {
                // For same-chain swaps, we get the complete transaction data
                const sameChainData = data as SameChainResponse;
                formattedQuote += `\nTransaction Details (Ready to Execute):
To: ${sameChainData.tx.to}
Value: ${sameChainData.tx.value}
Data: ${sameChainData.tx.data.slice(0, 32)}...

Source:
${sameChainData.tokenIn.amount} ${sameChainData.tokenIn.symbol}

Destination:
${sameChainData.tokenOut.amount} ${sameChainData.tokenOut.symbol}
Min Amount: ${sameChainData.tokenOut.minAmount || sameChainData.tokenOut.amount}

Slippage: ${sameChainData.slippage}%
Recommended Slippage: ${sameChainData.recommendedSlippage}%`;
            } else {
                // For cross-chain transfers, we first get the allowance target
                // A separate API call is needed to get the execution transaction
                const crossChainData = data as CrossChainResponse;
                const tx = crossChainData.tx || {};
                if (tx.allowanceTarget) {
                    formattedQuote += `\nStep 1 - Token Approval:
Allowance Target: ${tx.allowanceTarget}
Note: After approval, call the execution API to get the bridge transaction`;
                }

                // Add estimation details if available
                if (crossChainData.estimation) {
                    const { estimation } = crossChainData;
                    const sourceToken = estimation.srcChainTokenIn;
                    const destToken = estimation.dstChainTokenOut;

                    if (sourceToken) {
                        formattedQuote += `\n\nSource:
${sourceToken.amount} ${sourceToken.symbol} (Chain ${sourceToken.chainId})
USD Value: $${sourceToken.approximateUsdValue?.toFixed(2) || 'N/A'}`;
                    }

                    if (destToken) {
                        formattedQuote += `\n\nDestination:
${destToken.amount} ${destToken.symbol} (Chain ${destToken.chainId})
USD Value: $${destToken.approximateUsdValue?.toFixed(2) || 'N/A'}`;
                    }

                    // Add only total fees
                    if (estimation.fees) {
                        formattedQuote += '\n\nFees:';
                        if (estimation.fees.srcChainTokenIn) {
                            formattedQuote += `\nSource: ${estimation.fees.srcChainTokenIn} ${sourceToken?.symbol || ''}`;
                        }
                        if (estimation.fees.dstChainTokenOut) {
                            formattedQuote += `\nDestination: ${estimation.fees.dstChainTokenOut} ${destToken?.symbol || ''}`;
                        }
                    }

                    // Add only the count of cost details
                    if (estimation.costsDetails?.length) {
                        formattedQuote += `\n\nSteps: ${estimation.costsDetails.length} operations`;
                    }

                    // Add only essential slippage info
                    if (estimation.recommendedSlippage) {
                        formattedQuote += `\nRecommended Slippage: ${estimation.recommendedSlippage}%`;
                    }
                }

                // Add only essential additional information
                if (crossChainData.orderId) {
                    formattedQuote += `\n\nOrder ID: ${crossChainData.orderId}`;
                }
            }

            return toResult(formattedQuote);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const text = error.response?.data;
                return toResult(`Failed to get bridge quote: ${text}`, true);
            }
            throw error;
        }
    } catch (error) {
        return toResult(`Failed to get bridge quote: ${error}`, true);
    }
}
