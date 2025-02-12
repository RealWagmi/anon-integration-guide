import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';
import { actionAddRemoveLiqV3Abi } from '../../abis';

export interface TokenInput {
    tokenIn: Address;
    netTokenIn: string;
    tokenMintSy: Address;
    bulk: boolean;
    chainId?: number;
}

export interface ApproxParams {
    guessMin: string;
    guessMax: string;
    guessOffchain: string;
    maxIteration: number;
    eps: string;
}

export interface LimitOrderData {
    deadline: number;
    limitPrice: string;
}

export interface TokenOutput {
    tokenOut: Address;
    minTokenOut: string;
    bulk: boolean;
}

export async function addLiquidityDualTokenAndPt(
    receiver: Address,
    market: Address,
    input: TokenInput,
    netPtDesired: string,
    minLpOut: string,
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<{ netLpOut: string; netPtUsed: string; netSyInterm: string }>> {
    try {
        validateAddress(receiver);
        validateAddress(market);
        validateAddress(input.tokenIn);
        validateAddress(input.tokenMintSy);

        const provider = getProvider(input.chainId);
        const params = {
            abi: actionAddRemoveLiqV3Abi,
            functionName: 'addLiquidityDualTokenAndPt',
            args: [receiver, market, input, netPtDesired, minLpOut]
        };

        const txResult = await sendTransactions({ params });
        await notify('Successfully added dual token and PT liquidity');

        return {
            success: true,
            data: {
                netLpOut: txResult.data.netLpOut.toString(),
                netPtUsed: txResult.data.netPtUsed.toString(),
                netSyInterm: txResult.data.netSyInterm.toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function addLiquidityDualSyAndPt(
    receiver: Address,
    market: Address,
    netSyDesired: string,
    netPtDesired: string,
    minLpOut: string,
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<{ netLpOut: string; netSyUsed: string; netPtUsed: string }>> {
    try {
        validateAddress(receiver);
        validateAddress(market);

        const provider = getProvider();
        const params = {
            abi: actionAddRemoveLiqV3Abi,
            functionName: 'addLiquidityDualSyAndPt',
            args: [receiver, market, netSyDesired, netPtDesired, minLpOut]
        };

        const txResult = await sendTransactions({ params });
        await notify('Successfully added dual SY and PT liquidity');

        return {
            success: true,
            data: {
                netLpOut: txResult.data.netLpOut.toString(),
                netSyUsed: txResult.data.netSyUsed.toString(),
                netPtUsed: txResult.data.netPtUsed.toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function addLiquiditySinglePt(
    receiver: Address,
    market: Address,
    netPtIn: string,
    minLpOut: string,
    guessPtSwapToSy: ApproxParams,
    limit: LimitOrderData,
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<{ netLpOut: string; netSyFee: string }>> {
    try {
        validateAddress(receiver);
        validateAddress(market);

        const provider = getProvider();
        const params = {
            abi: actionAddRemoveLiqV3Abi,
            functionName: 'addLiquiditySinglePt',
            args: [receiver, market, netPtIn, minLpOut, guessPtSwapToSy, limit]
        };

        const txResult = await sendTransactions({ params });
        await notify('Successfully added single PT liquidity');

        return {
            success: true,
            data: {
                netLpOut: txResult.data.netLpOut.toString(),
                netSyFee: txResult.data.netSyFee.toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function addLiquiditySingleToken(
    receiver: Address,
    market: Address,
    minLpOut: string,
    guessPtReceivedFromSy: ApproxParams,
    input: TokenInput,
    limit: LimitOrderData,
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<{ netLpOut: string; netSyFee: string; netSyInterm: string }>> {
    try {
        validateAddress(receiver);
        validateAddress(market);
        validateAddress(input.tokenIn);
        validateAddress(input.tokenMintSy);

        const provider = getProvider(input.chainId);
        const params = {
            abi: actionAddRemoveLiqV3Abi,
            functionName: 'addLiquiditySingleToken',
            args: [receiver, market, minLpOut, guessPtReceivedFromSy, input, limit]
        };

        const txResult = await sendTransactions({ params });
        await notify('Successfully added single token liquidity');

        return {
            success: true,
            data: {
                netLpOut: txResult.data.netLpOut.toString(),
                netSyFee: txResult.data.netSyFee.toString(),
                netSyInterm: txResult.data.netSyInterm.toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function addLiquiditySingleSy(
    receiver: Address,
    market: Address,
    netSyIn: string,
    minLpOut: string,
    guessPtReceivedFromSy: ApproxParams,
    limit: LimitOrderData,
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<{ netLpOut: string; netSyFee: string }>> {
    try {
        validateAddress(receiver);
        validateAddress(market);

        const provider = getProvider();
        const params = {
            abi: actionAddRemoveLiqV3Abi,
            functionName: 'addLiquiditySingleSy',
            args: [receiver, market, netSyIn, minLpOut, guessPtReceivedFromSy, limit]
        };

        const txResult = await sendTransactions({ params });
        await notify('Successfully added single SY liquidity');

        return {
            success: true,
            data: {
                netLpOut: txResult.data.netLpOut.toString(),
                netSyFee: txResult.data.netSyFee.toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function removeLiquidityDualSyAndPt(
    receiver: Address,
    market: Address,
    netLpToRemove: string,
    minSyOut: string,
    minPtOut: string,
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<{ netSyOut: string; netPtOut: string }>> {
    try {
        validateAddress(receiver);
        validateAddress(market);

        const provider = getProvider();
        const params = {
            abi: actionAddRemoveLiqV3Abi,
            functionName: 'removeLiquidityDualSyAndPt',
            args: [receiver, market, netLpToRemove, minSyOut, minPtOut]
        };

        const txResult = await sendTransactions({ params });
        await notify('Successfully removed dual SY and PT liquidity');

        return {
            success: true,
            data: {
                netSyOut: txResult.data.netSyOut.toString(),
                netPtOut: txResult.data.netPtOut.toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function removeLiquiditySingleToken(
    receiver: Address,
    market: Address,
    netLpToRemove: string,
    output: TokenOutput,
    guessPtToToken: ApproxParams,
    limit: LimitOrderData,
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<{ netTokenOut: string; netSyFee: string; netSyInterm: string }>> {
    try {
        validateAddress(receiver);
        validateAddress(market);
        validateAddress(output.tokenOut);

        const provider = getProvider();
        const params = {
            abi: actionAddRemoveLiqV3Abi,
            functionName: 'removeLiquiditySingleToken',
            args: [receiver, market, netLpToRemove, output, guessPtToToken, limit]
        };

        const txResult = await sendTransactions({ params });
        await notify('Successfully removed single token liquidity');

        return {
            success: true,
            data: {
                netTokenOut: txResult.data.netTokenOut.toString(),
                netSyFee: txResult.data.netSyFee.toString(),
                netSyInterm: txResult.data.netSyInterm.toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function removeLiquiditySingleSy(
    receiver: Address,
    market: Address,
    netLpToRemove: string,
    minSyOut: string,
    guessPtToSy: ApproxParams,
    limit: LimitOrderData,
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<{ netSyOut: string; netSyFee: string }>> {
    try {
        validateAddress(receiver);
        validateAddress(market);

        const provider = getProvider();
        const params = {
            abi: actionAddRemoveLiqV3Abi,
            functionName: 'removeLiquiditySingleSy',
            args: [receiver, market, netLpToRemove, minSyOut, guessPtToSy, limit]
        };

        const txResult = await sendTransactions({ params });
        await notify('Successfully removed single SY liquidity');

        return {
            success: true,
            data: {
                netSyOut: txResult.data.netSyOut.toString(),
                netSyFee: txResult.data.netSyFee.toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
} 