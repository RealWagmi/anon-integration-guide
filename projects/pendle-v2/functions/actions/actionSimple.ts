import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';

const actionSimpleAbi = require('../../abis/IPActionSimple.json').abi;

interface TokenInput {
    tokenIn: Address;
    amountIn: string;
    tokenMintSy: Address;
    bulk: boolean;
}

export async function addLiquiditySinglePtSimple(
    receiver: Address,
    market: Address,
    netPtIn: string,
    minLpOut: string,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(receiver);
        validateAddress(market);

        await notify('Preparing to add liquidity with single PT...');
        const tx = {
            target: market,
            data: {
                abi: actionSimpleAbi,
                functionName: 'addLiquiditySinglePtSimple',
                args: [receiver, market, netPtIn, minLpOut]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: 'Successfully added liquidity with single PT'
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function addLiquiditySingleTokenSimple(
    receiver: Address,
    market: Address,
    minLpOut: string,
    input: TokenInput,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(receiver);
        validateAddress(market);
        validateAddress(input.tokenIn);
        validateAddress(input.tokenMintSy);

        await notify('Preparing to add liquidity with single token...');
        const tx = {
            target: market,
            data: {
                abi: actionSimpleAbi,
                functionName: 'addLiquiditySingleTokenSimple',
                args: [receiver, market, minLpOut, input]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: 'Successfully added liquidity with single token'
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function addLiquiditySingleSySimple(
    receiver: Address,
    market: Address,
    netSyIn: string,
    minLpOut: string,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(receiver);
        validateAddress(market);

        await notify('Preparing to add liquidity with single SY...');
        const tx = {
            target: market,
            data: {
                abi: actionSimpleAbi,
                functionName: 'addLiquiditySingleSySimple',
                args: [receiver, market, netSyIn, minLpOut]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: 'Successfully added liquidity with single SY'
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function removeLiquiditySinglePtSimple(
    receiver: Address,
    market: Address,
    netLpToRemove: string,
    minPtOut: string,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(receiver);
        validateAddress(market);

        await notify('Preparing to remove liquidity to single PT...');
        const tx = {
            target: market,
            data: {
                abi: actionSimpleAbi,
                functionName: 'removeLiquiditySinglePtSimple',
                args: [receiver, market, netLpToRemove, minPtOut]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: 'Successfully removed liquidity to single PT'
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function swapExactTokenForPtSimple(
    receiver: Address,
    market: Address,
    minPtOut: string,
    input: TokenInput,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(receiver);
        validateAddress(market);
        validateAddress(input.tokenIn);
        validateAddress(input.tokenMintSy);

        await notify('Preparing to swap exact token for PT...');
        const tx = {
            target: market,
            data: {
                abi: actionSimpleAbi,
                functionName: 'swapExactTokenForPtSimple',
                args: [receiver, market, minPtOut, input]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: 'Successfully swapped exact token for PT'
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
} 