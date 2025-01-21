import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';

const actionSwapYTV3Abi = [
    {
        name: 'swapExactSyForYt',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'receiver', type: 'address' },
            { name: 'market', type: 'address' },
            { name: 'exactSyIn', type: 'uint256' },
            { name: 'minYtOut', type: 'uint256' },
            {
                name: 'guessYtOut',
                type: 'tuple',
                components: [
                    { name: 'guessMin', type: 'uint256' },
                    { name: 'guessMax', type: 'uint256' },
                    { name: 'guessOffchain', type: 'uint256' },
                    { name: 'maxIteration', type: 'uint256' },
                    { name: 'eps', type: 'uint256' }
                ]
            },
            {
                name: 'limit',
                type: 'tuple',
                components: [
                    { name: 'deadline', type: 'uint256' },
                    { name: 'maxPriceImpact', type: 'uint256' }
                ]
            }
        ],
        outputs: [
            {
                name: '',
                type: 'tuple',
                components: [
                    { name: 'netYtOut', type: 'uint256' },
                    { name: 'netSyFee', type: 'uint256' }
                ]
            }
        ]
    }
];

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
    maxIteration: string;
    eps: string;
}

export interface LimitOrderData {
    deadline: string;
    maxPriceImpact: string;
}

export async function swapExactTokenForYt(
    receiver: Address,
    market: Address,
    minYtOut: string,
    guessYtOut: ApproxParams,
    input: TokenInput,
    limit: LimitOrderData,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<{
    netYtOut: string;
    netSyFee: string;
    netSyInterm: string;
}>> {
    try {
        validateAddress(receiver);
        validateAddress(market);

        // Prepare transaction
        await notify('Preparing to swap tokens for YT...');
        const tx = {
            target: market,
            data: {
                abi: actionSwapYTV3Abi,
                functionName: 'swapExactTokenForYt',
                args: [receiver, market, minYtOut, guessYtOut, input, limit]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: {
                netYtOut: result.data.netYtOut.toString(),
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

export async function swapExactSyForYt(
    receiver: Address,
    market: Address,
    exactSyIn: string,
    minYtOut: string,
    guessYtOut: ApproxParams,
    limit: LimitOrderData,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<{
    netYtOut: string;
    netSyFee: string;
}>> {
    try {
        validateAddress(receiver);
        validateAddress(market);

        // Prepare transaction
        await notify('Preparing to swap SY for YT...');
        const tx = {
            target: market,
            data: {
                abi: actionSwapYTV3Abi,
                functionName: 'swapExactSyForYt',
                args: [receiver, market, exactSyIn, minYtOut, guessYtOut, limit]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: {
                netYtOut: result.data.netYtOut.toString(),
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

export async function swapExactYtForToken(
    receiver: Address,
    market: Address,
    exactYtIn: string,
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
        await notify('Preparing to swap YT for tokens...');
        const tx = {
            target: market,
            data: {
                abi: actionSwapYTV3Abi,
                functionName: 'swapExactYtForToken',
                args: [receiver, market, exactYtIn, output, limit]
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

export async function swapExactYtForSy(
    receiver: Address,
    market: Address,
    exactYtIn: string,
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
        await notify('Preparing to swap YT for SY...');
        const tx = {
            target: market,
            data: {
                abi: actionSwapYTV3Abi,
                functionName: 'swapExactYtForSy',
                args: [receiver, market, exactYtIn, minSyOut, limit]
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