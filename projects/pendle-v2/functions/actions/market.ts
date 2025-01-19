import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';
import { marketAbi } from '../../abis';

export async function addLiquidity(
    receiver: Address,
    marketAddress: Address,
    tokenIn: Address[],
    netTokenIn: string[],
    minLpOut: string,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(receiver);
        validateAddress(marketAddress);
        tokenIn.forEach(validateAddress);

        if (tokenIn.length !== netTokenIn.length) {
            throw new ValidationError('Token and amount arrays must have same length');
        }

        // Convert string amounts to BigInt
        const netTokenInBigInt = netTokenIn.map((amount: string): bigint => BigInt(amount));

        // Prepare transaction
        await notify('Preparing to add liquidity...');
        const tx = {
            target: marketAddress,
            data: {
                abi: marketAbi,
                functionName: 'addLiquidity',
                args: [receiver, tokenIn, netTokenInBigInt, BigInt(minLpOut)]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: 'Successfully added liquidity'
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function removeLiquidity(
    receiver: Address,
    marketAddress: Address,
    netLpToRemove: string,
    minTokenOut: string[],
    tokenOut: Address[],
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string[]>> {
    try {
        validateAddress(receiver);
        validateAddress(marketAddress);
        tokenOut.forEach(validateAddress);

        if (tokenOut.length !== minTokenOut.length) {
            throw new ValidationError('Token and minimum amount arrays must have same length');
        }

        // Convert string amounts to BigInt
        const minTokenOutBigInt = minTokenOut.map((amount: string): bigint => BigInt(amount));
        const netLpToRemoveBigInt = BigInt(netLpToRemove);

        // Prepare transaction
        await notify('Preparing to remove liquidity...');
        const tx = {
            target: marketAddress,
            data: {
                abi: marketAbi,
                functionName: 'removeLiquidity',
                args: [receiver, netLpToRemoveBigInt, minTokenOutBigInt, tokenOut]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: result.tokenAmountOut.map((amount: bigint): string => amount.toString())
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function redeemRewards(
    marketAddress: Address,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<void>> {
    try {
        validateAddress(marketAddress);

        // Check if market is expired
        const provider = getProvider();
        const isExpired = await provider.readContract({
            address: marketAddress,
            abi: marketAbi,
            functionName: 'isExpired'
        });

        if (isExpired) {
            throw new ValidationError('Market has expired');
        }

        // Prepare transaction
        await notify('Preparing to redeem rewards...');
        const tx = {
            target: marketAddress,
            data: {
                abi: marketAbi,
                functionName: 'redeemRewards'
            }
        };

        await notify('Waiting for transaction confirmation...');
        await sendTransactions({ transactions: [tx] });

        return {
            success: true
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function isExpired(
    marketAddress: Address,
    { getProvider }: { getProvider: Function }
): Promise<Result<boolean>> {
    try {
        validateAddress(marketAddress);

        const provider = getProvider();
        const result = await provider.readContract({
            address: marketAddress,
            abi: marketAbi,
            functionName: 'isExpired'
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