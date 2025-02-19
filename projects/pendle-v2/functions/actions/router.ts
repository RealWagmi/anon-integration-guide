import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';
import { routerAbi } from '../../abis';

export async function initialize(
    factory: Address,
    WETH: Address,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<void>> {
    try {
        validateAddress(factory);
        validateAddress(WETH);

        // Prepare transaction
        await notify('Preparing to initialize router...');
        const tx = {
            target: 'router',
            data: {
                abi: routerAbi,
                functionName: 'initialize',
                args: [factory, WETH]
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

export async function addLiquidityETH(
    token: Address,
    amountTokenDesired: string,
    amountTokenMin: string,
    amountETHMin: string,
    to: Address,
    deadline: number,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<{
    amountToken: string;
    amountETH: string;
    liquidity: string;
}>> {
    try {
        validateAddress(token);
        validateAddress(to);

        // Convert amounts to BigInt
        const amountTokenDesiredBigInt = BigInt(amountTokenDesired);
        const amountTokenMinBigInt = BigInt(amountTokenMin);
        const amountETHMinBigInt = BigInt(amountETHMin);

        // Prepare transaction
        await notify('Preparing to add liquidity with ETH...');
        const tx = {
            target: 'router',
            data: {
                abi: routerAbi,
                functionName: 'addLiquidityETH',
                args: [token, amountTokenDesiredBigInt, amountTokenMinBigInt, amountETHMinBigInt, to, deadline]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: {
                amountToken: result.amountToken.toString(),
                amountETH: result.amountETH.toString(),
                liquidity: result.liquidity.toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function removeLiquidityETH(
    token: Address,
    liquidity: string,
    amountTokenMin: string,
    amountETHMin: string,
    to: Address,
    deadline: number,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<{
    amountToken: string;
    amountETH: string;
}>> {
    try {
        validateAddress(token);
        validateAddress(to);

        // Convert amounts to BigInt
        const liquidityBigInt = BigInt(liquidity);
        const amountTokenMinBigInt = BigInt(amountTokenMin);
        const amountETHMinBigInt = BigInt(amountETHMin);

        // Prepare transaction
        await notify('Preparing to remove liquidity to ETH...');
        const tx = {
            target: 'router',
            data: {
                abi: routerAbi,
                functionName: 'removeLiquidityETH',
                args: [token, liquidityBigInt, amountTokenMinBigInt, amountETHMinBigInt, to, deadline]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: {
                amountToken: result.amountToken.toString(),
                amountETH: result.amountETH.toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function swapExactTokensForTokens(
    amountIn: string,
    amountOutMin: string,
    path: Address[],
    to: Address,
    deadline: number,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string[]>> {
    try {
        validateAddress(to);
        path.forEach(validateAddress);

        // Convert amounts to BigInt
        const amountInBigInt = BigInt(amountIn);
        const amountOutMinBigInt = BigInt(amountOutMin);

        // Prepare transaction
        await notify('Preparing to swap exact tokens for tokens...');
        const tx = {
            target: 'router',
            data: {
                abi: routerAbi,
                functionName: 'swapExactTokensForTokens',
                args: [amountInBigInt, amountOutMinBigInt, path, to, deadline]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: result.amounts.map((amount: bigint): string => amount.toString())
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function swapTokensForExactTokens(
    amountOut: string,
    amountInMax: string,
    path: Address[],
    to: Address,
    deadline: number,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string[]>> {
    try {
        validateAddress(to);
        path.forEach(validateAddress);

        // Convert amounts to BigInt
        const amountOutBigInt = BigInt(amountOut);
        const amountInMaxBigInt = BigInt(amountInMax);

        // Prepare transaction
        await notify('Preparing to swap tokens for exact tokens...');
        const tx = {
            target: 'router',
            data: {
                abi: routerAbi,
                functionName: 'swapTokensForExactTokens',
                args: [amountOutBigInt, amountInMaxBigInt, path, to, deadline]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: result.amounts.map((amount: bigint): string => amount.toString())
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
} 