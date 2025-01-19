import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';
import { feeDistributorV2Abi } from '../../abis';

export async function claimRetail(
    receiver: Address,
    totalAccrued: string,
    proof: string[],
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<string>> {
    try {
        validateAddress(receiver);

        const provider = getProvider();
        const params = {
            abi: feeDistributorV2Abi,
            functionName: 'claimRetail',
            args: [receiver, totalAccrued, proof]
        };

        const txResult = await sendTransactions({ params });
        await notify('Successfully claimed retail rewards');

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

export async function claimProtocol(
    receiver: Address,
    pools: Address[],
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<{ totalAmountOut: string; amountsOut: string[] }>> {
    try {
        validateAddress(receiver);
        pools.forEach(validateAddress);

        const provider = getProvider();
        const params = {
            abi: feeDistributorV2Abi,
            functionName: 'claimProtocol',
            args: [receiver, pools]
        };

        const txResult = await sendTransactions({ params });
        await notify('Successfully claimed protocol rewards');

        return {
            success: true,
            data: {
                totalAmountOut: txResult.data.totalAmountOut.toString(),
                amountsOut: txResult.data.amountsOut.map((amount: bigint) => amount.toString())
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function getProtocolClaimables(
    user: Address,
    pools: Address[],
    { getProvider }: { getProvider: Function }
): Promise<Result<string[]>> {
    try {
        validateAddress(user);
        pools.forEach(validateAddress);

        const provider = getProvider();
        const result = await provider.readContract({
            abi: feeDistributorV2Abi,
            functionName: 'getProtocolClaimables',
            args: [user, pools]
        });

        return {
            success: true,
            data: result.map((amount: bigint) => amount.toString())
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function getProtocolTotalAccrued(
    user: Address,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(user);

        const provider = getProvider();
        const result = await provider.readContract({
            abi: feeDistributorV2Abi,
            functionName: 'getProtocolTotalAccrued',
            args: [user]
        });

        return {
            success: true,
            data: result.toString()
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
} 