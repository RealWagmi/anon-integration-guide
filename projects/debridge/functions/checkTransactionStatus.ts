import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { DEBRIDGE_API_URL } from '../constants';

interface Props {
    txHash: string;
}

type OrderStatus =
    | 'None'
    | 'Created'
    | 'Fulfilled'
    | 'SentUnlock'
    | 'OrderCancelled'
    | 'SentOrderCancel'
    | 'ClaimedUnlock'
    | 'ClaimedOrderCancel';

interface OrderStatusResponse {
    status: OrderStatus;
    orderId: string;
    orderLink: string;
}

interface OrderIdsResponse {
    orderIds: string[];
}

/**
 * Check the status of a bridge transaction.
 * 
 * Status meanings:
 * - None: Order not found or invalid
 * - Created: Order created but not yet processed
 * - Fulfilled: Order has been processed and tokens are being transferred
 * - SentUnlock: Tokens have been unlocked on the destination chain
 * - OrderCancelled: Order was cancelled by the user or system
 * - SentOrderCancel: Cancellation request has been sent
 * - ClaimedUnlock: Tokens have been claimed by the recipient
 * - ClaimedOrderCancel: Cancellation has been completed and tokens returned
 * 
 * @param props - The function parameters
 * @param props.txHash - Transaction hash to check status for
 * @param tools - System tools for blockchain interactions
 * @returns Order status information
 */
export async function checkTransactionStatus(
    { txHash }: Props,
    { notify }: FunctionOptions
): Promise<FunctionReturn> {
    try {
        // Validate txHash
        if (!txHash) {
            return toResult('Transaction hash is required', true);
        }

        if (!txHash.match(/^0x[a-fA-F0-9]{64}$/)) {
            return toResult('Invalid transaction hash format', true);
        }

        await notify('Checking transaction status...');

        // First get the order IDs for the transaction
        const orderIdsUrl = `${DEBRIDGE_API_URL}/dln/tx/${txHash}/order-ids`;
        const orderIdsResponse = await fetch(orderIdsUrl);
        
        if (!orderIdsResponse.ok) {
            return toResult(`Failed to get order IDs: ${await orderIdsResponse.text()}`, true);
        }

        const orderIdsData = await orderIdsResponse.json() as OrderIdsResponse;
        if (!orderIdsData.orderIds || orderIdsData.orderIds.length === 0) {
            return toResult('No order IDs found for this transaction', true);
        }

        // Get status for each order
        const statuses = await Promise.all(orderIdsData.orderIds.map(async (orderId) => {
            const statusUrl = `${DEBRIDGE_API_URL}/dln/order/${orderId}/status`;
            const statusResponse = await fetch(statusUrl);
            
            if (!statusResponse.ok) {
                throw new Error(`Failed to get status for order ${orderId}: ${await statusResponse.text()}`);
            }

            const status = await statusResponse.json() as OrderStatusResponse;
            return {
                ...status,
                orderLink: `https://app.debridge.finance/order?orderId=${orderId}`,
                description: getStatusDescription(status.status)
            };
        }));

        // Format the response message
        const message = statuses.map(status => 
            `Order ID: ${status.orderId}
Status: ${status.status} - ${status.description}
Track your order: ${status.orderLink}`
        ).join('\n\n');

        return toResult(message);
    } catch (error) {
        return toResult(`ERROR: Failed to check transaction status: ${error}`, true);
    }
}

/**
 * Get a human-readable description of an order status
 */
function getStatusDescription(status: OrderStatus): string {
    switch (status) {
        case 'None':
            return 'Order not found or invalid';
        case 'Created':
            return 'Order created but not yet processed';
        case 'Fulfilled':
            return 'Order has been processed and tokens are being transferred';
        case 'SentUnlock':
            return 'Tokens have been unlocked on the destination chain';
        case 'OrderCancelled':
            return 'Order was cancelled by the user or system';
        case 'SentOrderCancel':
            return 'Cancellation request has been sent';
        case 'ClaimedUnlock':
            return 'Tokens have been claimed by the recipient';
        case 'ClaimedOrderCancel':
            return 'Cancellation has been completed and tokens returned';
        default:
            return 'Unknown status';
    }
}
