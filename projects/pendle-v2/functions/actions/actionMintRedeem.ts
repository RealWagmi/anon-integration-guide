import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';

const actionMintRedeemAbi = require('../../abis/IPActionMintRedeemStatic.json').abi;

export async function getAmountTokenToMintSy(
    SY: Address,
    tokenIn: Address,
    netSyOut: string,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(SY);
        validateAddress(tokenIn);

        const provider = getProvider();
        const result = await provider.readContract({
            address: SY,
            abi: actionMintRedeemAbi,
            functionName: 'getAmountTokenToMintSy',
            args: [SY, tokenIn, netSyOut]
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

export async function mintPyFromSyStatic(
    YT: Address,
    netSyToMint: string,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(YT);

        const provider = getProvider();
        const result = await provider.readContract({
            address: YT,
            abi: actionMintRedeemAbi,
            functionName: 'mintPyFromSyStatic',
            args: [YT, netSyToMint]
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

export async function mintPyFromTokenStatic(
    YT: Address,
    tokenIn: Address,
    netTokenIn: string,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(YT);
        validateAddress(tokenIn);

        const provider = getProvider();
        const result = await provider.readContract({
            address: YT,
            abi: actionMintRedeemAbi,
            functionName: 'mintPyFromTokenStatic',
            args: [YT, tokenIn, netTokenIn]
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

export async function mintSyFromTokenStatic(
    SY: Address,
    tokenIn: Address,
    netTokenIn: string,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(SY);
        validateAddress(tokenIn);

        const provider = getProvider();
        const result = await provider.readContract({
            address: SY,
            abi: actionMintRedeemAbi,
            functionName: 'mintSyFromTokenStatic',
            args: [SY, tokenIn, netTokenIn]
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

export async function redeemPyToSyStatic(
    YT: Address,
    netPYToRedeem: string,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(YT);

        const provider = getProvider();
        const result = await provider.readContract({
            address: YT,
            abi: actionMintRedeemAbi,
            functionName: 'redeemPyToSyStatic',
            args: [YT, netPYToRedeem]
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

export async function redeemPyToTokenStatic(
    YT: Address,
    netPYToRedeem: string,
    tokenOut: Address,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(YT);
        validateAddress(tokenOut);

        const provider = getProvider();
        const result = await provider.readContract({
            address: YT,
            abi: actionMintRedeemAbi,
            functionName: 'redeemPyToTokenStatic',
            args: [YT, netPYToRedeem, tokenOut]
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

export async function redeemSyToTokenStatic(
    SY: Address,
    tokenOut: Address,
    netSyIn: string,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(SY);
        validateAddress(tokenOut);

        const provider = getProvider();
        const result = await provider.readContract({
            address: SY,
            abi: actionMintRedeemAbi,
            functionName: 'redeemSyToTokenStatic',
            args: [SY, tokenOut, netSyIn]
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

export async function pyIndexCurrentViewMarket(
    market: Address,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(market);

        const provider = getProvider();
        const result = await provider.readContract({
            address: market,
            abi: actionMintRedeemAbi,
            functionName: 'pyIndexCurrentViewMarket',
            args: [market]
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