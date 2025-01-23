import { FunctionReturn, FunctionOptions, toResult, TransactionParams } from '@heyanon/sdk';
import { Address } from 'viem';
import { DEBRIDGE_API_URL } from '../constants';

const REFERRAL_CODE = "21064"; // Using the default from original implementation

interface Props {
    srcChainId: string;
    srcChainTokenIn: string;
    srcChainTokenInAmount: string;
    dstChainId: string;
    dstChainTokenOut: string;
    dstChainTokenOutRecipient: string;
    account: Address;
}

interface BridgeOrderResponse {
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
 * Create a bridge order to transfer tokens between chains.
 * 
 * Special considerations for different chains:
 * 
 * EVM to EVM:
 * - Set dstChainTokenOutRecipient to recipient's EVM address
 * - Set dstChainTokenOut to the erc-20 format address
 * 
 * To Solana (7565164):
 * - dstChainTokenOutRecipient should be Solana address (base58)
 * - dstChainTokenOut should be Solana token mint address (base58)
 * 
 * From Solana:
 * - dstChainTokenOutRecipient should be EVM address
 * - dstChainTokenOut should be ERC-20 format address
 * 
 * @param props - The function parameters
 * @param props.srcChainId - Source chain ID
 * @param props.srcChainTokenIn - Token address on source chain
 * @param props.srcChainTokenInAmount - Amount in base units
 * @param props.dstChainId - Destination chain ID
 * @param props.dstChainTokenOut - Token address on destination chain
 * @param props.dstChainTokenOutRecipient - Recipient address on destination chain
 * @param props.account - User's wallet address (sender)
 * @param tools - System tools for blockchain interactions
 * @returns Bridge order details and transaction data
 */
export async function createBridgeOrder(
    {
        srcChainId,
        srcChainTokenIn,
        srcChainTokenInAmount,
        dstChainId,
        dstChainTokenOut,
        dstChainTokenOutRecipient,
        account,
    }: Props,
    { notify, sendTransactions }: FunctionOptions
): Promise<FunctionReturn> {
    try {
        // Check wallet connection
        if (!account) return toResult('Wallet not connected', true);

        await notify('Creating bridge order...');

        // Validate chain IDs
        if (srcChainId === dstChainId) {
            return toResult('Source and destination chains must be different', true);
        }

        // Convert srcChainId to number
        const sourceChainId = parseInt(srcChainId, 10);
        if (isNaN(sourceChainId)) {
            return toResult('Invalid source chain ID', true);
        }

        // Construct parameters
        const params = new URLSearchParams();
        params.append("srcChainId", srcChainId);
        params.append("srcChainTokenIn", srcChainTokenIn);
        params.append("srcChainTokenInAmount", srcChainTokenInAmount);
        params.append("dstChainId", dstChainId);
        params.append("dstChainTokenOut", dstChainTokenOut);
        params.append("dstChainTokenOutRecipient", dstChainTokenOutRecipient);
        params.append("senderAddress", account);
        // Always use senderAddress for source chain authorities
        params.append("srcChainOrderAuthorityAddress", account);
        params.append("srcChainRefundAddress", account);
        // Always use dstChainTokenOutRecipient for destination chain authority
        params.append("dstChainOrderAuthorityAddress", dstChainTokenOutRecipient);
        params.append("referralCode", REFERRAL_CODE);
        params.append("prependOperatingExpenses", "true");

        const url = `${DEBRIDGE_API_URL}/dln/order/create-tx?${params}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            const text = await response.text();
            return toResult(`Failed to create bridge order: ${text}`, true);
        }

        const data = await response.json() as BridgeOrderResponse;
        if ('error' in data) {
            return toResult(`API Error: ${data.error}`, true);
        }

        // Format the response in a user-friendly way
        const { estimation } = data;
        const sourceToken = estimation.srcChainTokenIn;
        const destToken = estimation.dstChainTokenOut;
        
        // Create transaction parameters
        const transaction: TransactionParams = {
            target: data.tx.to as `0x${string}`,
            data: data.tx.data as `0x${string}`,
            value: BigInt(data.tx.value || '0'),
        };

        // Send the transaction
        await notify('Sending bridge transaction...');
        const result = await sendTransactions({
            chainId: sourceChainId,
            account,
            transactions: [transaction],
        });

        const message = result.data[result.data.length - 1];
        const successMessage = `Bridge order created successfully!

From: ${sourceToken.amount} ${sourceToken.symbol} on chain ${srcChainId}
To: ${destToken.amount} ${destToken.symbol} on chain ${dstChainId}
Recipient: ${dstChainTokenOutRecipient}

Fees:
- Source Chain: ${estimation.fees.srcChainTokenIn} ${sourceToken.symbol}
- Destination Chain: ${estimation.fees.dstChainTokenOut} ${destToken.symbol}

${message.message}`;

        return toResult(successMessage);
    } catch (error) {
        return toResult(`Failed to create bridge order: ${error}`, true);
    }
}
