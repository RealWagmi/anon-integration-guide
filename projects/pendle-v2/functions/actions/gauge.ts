import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';
import { pendleGaugeAbi } from '../../abis';

export async function getTotalActiveSupply(
    gaugeAddress: Address,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(gaugeAddress);

        const provider = getProvider();
        const result = await provider.readContract({
            address: gaugeAddress,
            abi: pendleGaugeAbi,
            functionName: 'totalActiveSupply',
            args: []
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

export async function getActiveBalance(
    gaugeAddress: Address,
    user: Address,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(gaugeAddress);
        validateAddress(user);

        const provider = getProvider();
        const result = await provider.readContract({
            address: gaugeAddress,
            abi: pendleGaugeAbi,
            functionName: 'activeBalance',
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

export async function redeemRewards(
    gaugeAddress: Address,
    user: Address,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string[]>> {
    try {
        validateAddress(gaugeAddress);
        validateAddress(user);

        // Prepare transaction
        await notify('Preparing to redeem rewards...');
        const tx = {
            target: gaugeAddress,
            data: {
                abi: pendleGaugeAbi,
                functionName: 'redeemRewards',
                args: [user]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: result.data
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function getRewardTokens(
    gaugeAddress: Address,
    { getProvider }: { getProvider: Function }
): Promise<Result<Address[]>> {
    try {
        validateAddress(gaugeAddress);

        const provider = getProvider();
        const result = await provider.readContract({
            address: gaugeAddress,
            abi: pendleGaugeAbi,
            functionName: 'getRewardTokens',
            args: []
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