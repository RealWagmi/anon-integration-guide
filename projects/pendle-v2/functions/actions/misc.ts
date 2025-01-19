import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';
import { actionMiscV3Abi } from '../../abis';
import { type TokenInput, type TokenOutput } from './swapPT';

export interface RedeemYtIncomeToTokenStruct {
    yt: Address;
    doRedeemInterest: boolean;
    doRedeemRewards: boolean;
    tokenRedeemSy: Address;
    minTokenRedeemOut: string;
}

export interface SwapDataExtra {
    tokenIn: Address;
    tokenOut: Address;
    minTokenOut: string;
    deadline: string;
    swapData: string;
}

export interface ExitPreExpReturnParams {
    netSyFeeFromPt: string;
    netSyFeeFromYt: string;
    netSyFromPt: string;
    netSyFromYt: string;
    netSyFromLp: string;
    totalSyOut: string;
}

export async function mintSyFromToken(
    receiver: Address,
    SY: Address,
    minSyOut: string,
    input: TokenInput,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(receiver);
        validateAddress(SY);
        validateAddress(input.tokenIn);
        validateAddress(input.tokenMintSy);

        // Prepare transaction
        await notify('Preparing to mint SY from token...');
        const tx = {
            target: 'actionMiscV3',
            data: {
                abi: actionMiscV3Abi,
                functionName: 'mintSyFromToken',
                args: [receiver, SY, minSyOut, input]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: result.data.toString()
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function redeemSyToToken(
    receiver: Address,
    SY: Address,
    netSyIn: string,
    output: TokenOutput,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(receiver);
        validateAddress(SY);
        validateAddress(output.tokenOut);

        // Prepare transaction
        await notify('Preparing to redeem SY to token...');
        const tx = {
            target: 'actionMiscV3',
            data: {
                abi: actionMiscV3Abi,
                functionName: 'redeemSyToToken',
                args: [receiver, SY, netSyIn, output]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: result.data.toString()
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function mintPyFromToken(
    receiver: Address,
    YT: Address,
    minPyOut: string,
    input: TokenInput,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<{
    netPyOut: string;
    netSyInterm: string;
}>> {
    try {
        validateAddress(receiver);
        validateAddress(YT);
        validateAddress(input.tokenIn);
        validateAddress(input.tokenMintSy);

        // Prepare transaction
        await notify('Preparing to mint PY from token...');
        const tx = {
            target: 'actionMiscV3',
            data: {
                abi: actionMiscV3Abi,
                functionName: 'mintPyFromToken',
                args: [receiver, YT, minPyOut, input]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: {
                netPyOut: result.data.netPyOut.toString(),
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

export async function redeemPyToToken(
    receiver: Address,
    YT: Address,
    netPyIn: string,
    output: TokenOutput,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<{
    netTokenOut: string;
    netSyInterm: string;
}>> {
    try {
        validateAddress(receiver);
        validateAddress(YT);
        validateAddress(output.tokenOut);

        // Prepare transaction
        await notify('Preparing to redeem PY to token...');
        const tx = {
            target: 'actionMiscV3',
            data: {
                abi: actionMiscV3Abi,
                functionName: 'redeemPyToToken',
                args: [receiver, YT, netPyIn, output]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: {
                netTokenOut: result.data.netTokenOut.toString(),
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

export async function mintPyFromSy(
    receiver: Address,
    YT: Address,
    netSyIn: string,
    minPyOut: string,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(receiver);
        validateAddress(YT);

        // Prepare transaction
        await notify('Preparing to mint PY from SY...');
        const tx = {
            target: 'actionMiscV3',
            data: {
                abi: actionMiscV3Abi,
                functionName: 'mintPyFromSy',
                args: [receiver, YT, netSyIn, minPyOut]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: result.data.toString()
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function redeemPyToSy(
    receiver: Address,
    YT: Address,
    netPyIn: string,
    minSyOut: string,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(receiver);
        validateAddress(YT);

        // Prepare transaction
        await notify('Preparing to redeem PY to SY...');
        const tx = {
            target: 'actionMiscV3',
            data: {
                abi: actionMiscV3Abi,
                functionName: 'redeemPyToSy',
                args: [receiver, YT, netPyIn, minSyOut]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: result.data.toString()
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function redeemDueInterestAndRewards(
    user: Address,
    sys: Address[],
    yts: Address[],
    markets: Address[],
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<boolean>> {
    try {
        validateAddress(user);
        sys.forEach(validateAddress);
        yts.forEach(validateAddress);
        markets.forEach(validateAddress);

        // Prepare transaction
        await notify('Preparing to redeem due interest and rewards...');
        const tx = {
            target: 'actionMiscV3',
            data: {
                abi: actionMiscV3Abi,
                functionName: 'redeemDueInterestAndRewards',
                args: [user, sys, yts, markets]
            }
        };

        await notify('Waiting for transaction confirmation...');
        await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: true
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function exitPreExpToToken(
    receiver: Address,
    market: Address,
    netPtIn: string,
    netYtIn: string,
    netLpIn: string,
    output: TokenOutput,
    limit: { deadline: string, limitPrice: string },
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<{
    totalTokenOut: string;
    params: ExitPreExpReturnParams;
}>> {
    try {
        validateAddress(receiver);
        validateAddress(market);
        validateAddress(output.tokenOut);

        // Prepare transaction
        await notify('Preparing to exit pre-expiry to token...');
        const tx = {
            target: 'actionMiscV3',
            data: {
                abi: actionMiscV3Abi,
                functionName: 'exitPreExpToToken',
                args: [receiver, market, netPtIn, netYtIn, netLpIn, output, limit]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: {
                totalTokenOut: result.data.totalTokenOut.toString(),
                params: {
                    netSyFeeFromPt: result.data.params.netSyFeeFromPt.toString(),
                    netSyFeeFromYt: result.data.params.netSyFeeFromYt.toString(),
                    netSyFromPt: result.data.params.netSyFromPt.toString(),
                    netSyFromYt: result.data.params.netSyFromYt.toString(),
                    netSyFromLp: result.data.params.netSyFromLp.toString(),
                    totalSyOut: result.data.params.totalSyOut.toString()
                }
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

export async function exitPreExpToSy(
    receiver: Address,
    market: Address,
    netPtIn: string,
    netYtIn: string,
    netLpIn: string,
    minSyOut: string,
    limit: { deadline: string, limitPrice: string },
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<ExitPreExpReturnParams>> {
    try {
        validateAddress(receiver);
        validateAddress(market);

        // Prepare transaction
        await notify('Preparing to exit pre-expiry to SY...');
        const tx = {
            target: 'actionMiscV3',
            data: {
                abi: actionMiscV3Abi,
                functionName: 'exitPreExpToSy',
                args: [receiver, market, netPtIn, netYtIn, netLpIn, minSyOut, limit]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: {
                netSyFeeFromPt: result.data.netSyFeeFromPt.toString(),
                netSyFeeFromYt: result.data.netSyFeeFromYt.toString(),
                netSyFromPt: result.data.netSyFromPt.toString(),
                netSyFromYt: result.data.netSyFromYt.toString(),
                netSyFromLp: result.data.netSyFromLp.toString(),
                totalSyOut: result.data.totalSyOut.toString()
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
} 