import { Address, isAddress } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { _getUsersVaultAddress } from './utils/_getUsersVaultAddress';
import { _getVaultAddress } from './utils/_getVaultAddress';
import { _getOpenOrders } from './utils/_getOpenOrders';

interface Props {
    account: Address;
    vault?: string;
}

/**
 * Gets the user's open orders on Hyperliquid.
 *
 * @param account - User's wallet address
 * @param vault - Add this if you want to do this for the vault. Can be vault name or address.
 * @param options - SDK function options
 * @returns Promise resolving to function execution result
 */
export async function getOpenOrders({ account, vault }: Props, _options: FunctionOptions): Promise<FunctionReturn> {
    try {
        if (vault && !isAddress(vault)) {
            vault = await _getVaultAddress(vault);
            if (!vault) return toResult('Invalid vault specified', true);
        }
        console.log('Getting open orders for account:', vault || account);

        // Fetch the orders data
        const orders = await _getOpenOrders((vault || account) as `0x${string}`);
        
        if (!orders || orders.length === 0) {
            return toResult("No open orders found.");
        }

        // Prepare arrays for known orders and unknown ones
        const knownOrders: string[] = [];
        const unknownOrders: any[] = [];

        orders.forEach((order: any, index: number) => {
            // Format the timestamp to a human-readable string
            const formattedTimestamp = new Date(order.timestamp).toLocaleString();
            // Convert the side field into a readable format
            const sideText = order.side === "B" ? "LONG" :"SHORT";
            
            let orderDetails = `📦 Order #${index + 1}:\n` +
                               `• ID: ${order.oid}\n` +
                               `• Coin: ${order.coin}\n` +
                               `• Order Type: ${order.orderType}\n` +
                               `• Timestamp: ${formattedTimestamp}\n` +
                               `• Size: ${order.sz}\n` +
                               `• Side: ${sideText}`;

            // For Limit orders, include the limit price
            if (order.orderType === "Limit") {
                orderDetails += `\n• Limit Price: $${order.limitPx}`;
                knownOrders.push(orderDetails);
            }
            // For Stop Market or Take Profit Market, include trigger condition and trigger price
            else if (order.orderType === "Stop Market" || order.orderType === "Take Profit Market") {
                orderDetails += `\n• Trigger Condition: ${order.triggerCondition}`;
                knownOrders.push(orderDetails);
            }
            else if (order.orderType === "Stop Limit" || order.orderType === "Take Profit Limit") {
                orderDetails += `\n• Trigger Condition: ${order.triggerCondition}\n• Limit price: ${order.limitPx}`;
                knownOrders.push(orderDetails);
            }
            // For unknown order types, collect the full JSON
            else {
                unknownOrders.push(order);
            }
        });

        // Build the response string
        let response = "=== OPEN ORDERS ===\n\n";
        if (knownOrders.length > 0) {
            response += knownOrders.join("\n\n");
        }
        if (unknownOrders.length > 0) {
            // Join all unknown orders JSON into one line separated by a delimiter (|).
            const unknowns = unknownOrders.map(o => JSON.stringify(o)).join(" | ");
            response += "\n\nUnknown orders found:\n" + unknowns;
        }
        
        return toResult(response);
    } catch (error) {
        console.log('Open orders error:', error);
        return toResult(`Failed to fetch open orders: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}

