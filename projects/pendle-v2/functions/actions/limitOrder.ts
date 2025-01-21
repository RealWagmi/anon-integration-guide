import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';
import { limitRouterAbi } from '../../abis';

export interface Order {
    salt: string;
    expiry: number;
    nonce: number;
    orderType: number;
    token: Address;
    YT: Address;
    maker: Address;
    receiver: Address;
    makingAmount: string;
    lnImpliedRate: string;
    failSafeRate: string;
    permit: string;
}

export async function cancelBatchOrders(
    orders: Order[],
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<string>> {
    try {
        orders.forEach(order => {
            validateAddress(order.token);
            validateAddress(order.YT);
            validateAddress(order.maker);
            validateAddress(order.receiver);
        });

        const provider = getProvider();
        const params = {
            abi: limitRouterAbi,
            functionName: 'cancelBatch',
            args: [orders]
        };

        const txResult = await sendTransactions({ params });
        await notify('Successfully cancelled batch orders');

        return {
            success: true,
            data: txResult.data
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function cancelOrder(
    order: Order,
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<string>> {
    try {
        validateAddress(order.token);
        validateAddress(order.YT);
        validateAddress(order.maker);
        validateAddress(order.receiver);

        const provider = getProvider();
        const params = {
            abi: limitRouterAbi,
            functionName: 'cancelSingle',
            args: [order]
        };

        const txResult = await sendTransactions({ params });
        await notify('Successfully cancelled order');

        return {
            success: true,
            data: txResult.data
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function getOrderStatuses(
    orderHashes: string[],
    { getProvider }: { getProvider: Function }
): Promise<Result<{ remainings: string[]; filledAmounts: string[] }>> {
    try {
        const provider = getProvider();
        const result = await provider.readContract({
            abi: limitRouterAbi,
            functionName: 'orderStatuses',
            args: [orderHashes]
        });

        return {
            success: true,
            data: {
                remainings: result[0].map((amount: bigint) => amount.toString()),
                filledAmounts: result[1].map((amount: bigint) => amount.toString())
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function getDomainSeparator(
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        const provider = getProvider();
        const result = await provider.readContract({
            abi: limitRouterAbi,
            functionName: 'DOMAIN_SEPARATOR'
        });

        return {
            success: true,
            data: result
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export interface FillOrderParams {
    order: Order;
    makingAmount: string;
    signature: string;
}

export async function fillOrders(
    params: FillOrderParams[],
    receiver: Address,
    maxTaking: string,
    callback: string,
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<{
    actualMaking: string;
    actualTaking: string;
    totalFee: string;
    callbackReturn: string;
}>> {
    try {
        validateAddress(receiver);
        params.forEach(param => {
            validateAddress(param.order.token);
            validateAddress(param.order.YT);
            validateAddress(param.order.maker);
            validateAddress(param.order.receiver);
        });

        const provider = getProvider();
        const fillParams = {
            abi: limitRouterAbi,
            functionName: 'fill',
            args: [params, receiver, maxTaking, '0x', callback]
        };

        const txResult = await sendTransactions({ fillParams });
        await notify('Successfully filled orders');

        return {
            success: true,
            data: {
                actualMaking: txResult.data.actualMaking.toString(),
                actualTaking: txResult.data.actualTaking.toString(),
                totalFee: txResult.data.totalFee.toString(),
                callbackReturn: txResult.data.callbackReturn
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function simulate(
    target: Address,
    data: string,
    { getProvider, sendTransactions }: { getProvider: Function; sendTransactions: Function }
): Promise<Result<{ success: boolean; result: string }>> {
    try {
        validateAddress(target);

        const provider = getProvider();
        const params = {
            abi: limitRouterAbi,
            functionName: 'simulate',
            args: [target, data]
        };

        const txResult = await sendTransactions({ params });

        return {
            success: true,
            data: {
                success: txResult.data.success,
                result: txResult.data.result
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
} 