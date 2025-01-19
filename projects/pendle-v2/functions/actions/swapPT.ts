import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';
import { actionSwapPTV3Abi } from '../../abis';

export interface TokenInput {
    tokenIn: Address;
    amountIn: string;
    tokenMintSy: Address;
    bulk: boolean;
}

export interface TokenOutput {
    tokenOut: Address;
    minTokenOut: string;
    bulk: boolean;
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

export async function swapExactTokenForPt(
    receiver: Address,
    market: Address,
    minPtOut: string,
    guessPtOut: ApproxParams,
    input: TokenInput,
    limit: LimitOrderData,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<{
    netPtOut: string;
    netSyFee: string;
    netSyInterm: string;
}>> {
    try {
        validateAddress(receiver);
        validateAddress(market);

        // Prepare transaction
        await notify('Preparing to swap tokens for PT...');
        const tx = {
            target: market,
            data: {
                abi: actionSwapPTV3Abi,
                functionName: 'swapExactTokenForPt',
                args: [receiver, market, minPtOut, guessPtOut, input, limit]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: {
                netPtOut: result.data.netPtOut.toString(),
                netSyFee: result.data.netSyFee.toString(),
                netSyInterm: result.data.netSyInterm.toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function swapExactSyForPt(
    receiver: Address,
    market: Address,
    exactSyIn: string,
    minPtOut: string,
    guessPtOut: ApproxParams,
    limit: LimitOrderData,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<{
    netPtOut: string;
    netSyFee: string;
}>> {
    try {
        validateAddress(receiver);
        validateAddress(market);

        // Prepare transaction
        await notify('Preparing to swap SY for PT...');
        const tx = {
            target: market,
            data: {
                abi: actionSwapPTV3Abi,
                functionName: 'swapExactSyForPt',
                args: [receiver, market, exactSyIn, minPtOut, guessPtOut, limit]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: {
                netPtOut: result.data.netPtOut.toString(),
                netSyFee: result.data.netSyFee.toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function swapExactPtForToken(
    receiver: Address,
    market: Address,
    exactPtIn: string,
    output: TokenOutput,
    limit: LimitOrderData,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<{
    netTokenOut: string;
    netSyFee: string;
    netSyInterm: string;
}>> {
    try {
        validateAddress(receiver);
        validateAddress(market);

        // Prepare transaction
        await notify('Preparing to swap PT for tokens...');
        const tx = {
            target: market,
            data: {
                abi: actionSwapPTV3Abi,
                functionName: 'swapExactPtForToken',
                args: [receiver, market, exactPtIn, output, limit]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: {
                netTokenOut: result.data.netTokenOut.toString(),
                netSyFee: result.data.netSyFee.toString(),
                netSyInterm: result.data.netSyInterm.toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function swapExactPtForSy(
    receiver: Address,
    market: Address,
    exactPtIn: string,
    minSyOut: string,
    limit: LimitOrderData,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<{
    netSyOut: string;
    netSyFee: string;
}>> {
    try {
        validateAddress(receiver);
        validateAddress(market);

        // Prepare transaction
        await notify('Preparing to swap PT for SY...');
        const tx = {
            target: market,
            data: {
                abi: actionSwapPTV3Abi,
                functionName: 'swapExactPtForSy',
                args: [receiver, market, exactPtIn, minSyOut, limit]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: {
                netSyOut: result.data.netSyOut.toString(),
                netSyFee: result.data.netSyFee.toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
} 