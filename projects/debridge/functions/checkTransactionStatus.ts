import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { DEBRIDGE_API_URL } from '../constants';

interface Props {
    orderId: string;
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
 * @param props.orderId - ID of the order to check
 * @param tools - System tools for blockchain interactions
 * @returns Order status information
 */
export async function checkTransactionStatus(
    { orderId }: Props,
    { notify }: FunctionOptions
): Promise<FunctionReturn> {
    try {
        // Validate orderId
        if (!orderId) {
            return toResult('Order ID is required', true);
        }

        await notify('Checking transaction status...');

        // Construct parameters
        const params = new URLSearchParams();
        params.append("orderId", orderId);

        const url = `${DEBRIDGE_API_URL}/dln/order/status?${params}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            const text = await response.text();
            return toResult(`Failed to check transaction status: ${text}`, true);
        }

        const data = await response.json() as OrderStatusResponse;
        if ('error' in data) {
            return toResult(`API Error: ${data.error}`, true);
        }

        // Get human-readable status description
        const statusDescription = getStatusDescription(data.status);

        const message = `Transaction Status:
Order ID: ${data.orderId}
Status: ${data.status} - ${statusDescription}
Track your order: ${data.orderLink}`;

        return toResult(message);
    } catch (error) {
        return toResult(`Failed to check transaction status: ${error}`, true);
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
            return 'Order has been created and is awaiting processing';
        case 'Fulfilled':
            return 'Order has been processed and tokens are being transferred';
        case 'SentUnlock':
            return 'Tokens have been unlocked on the destination chain';
        case 'OrderCancelled':
            return 'Order was cancelled';
        case 'SentOrderCancel':
            return 'Cancellation request has been sent';
        case 'ClaimedUnlock':
            return 'Tokens have been successfully claimed by the recipient';
        case 'ClaimedOrderCancel':
            return 'Cancellation has been completed and tokens have been returned';
        default:
            return 'Unknown status';
    }
}
