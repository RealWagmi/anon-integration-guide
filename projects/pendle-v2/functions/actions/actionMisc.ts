import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';

const actionMiscAbi = [
    {
        name: 'mintSyFromToken',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'receiver', type: 'address' },
            { name: 'SY', type: 'address' },
            { name: 'minSyOut', type: 'uint256' },
            {
                name: 'input',
                type: 'tuple',
                components: [
                    { name: 'tokenIn', type: 'address' },
                    { name: 'amountIn', type: 'uint256' },
                    { name: 'tokenMintSy', type: 'address' },
                    { name: 'bulk', type: 'bool' }
                ]
            }
        ],
        outputs: [{ type: 'uint256' }]
    }
];

interface TokenInput {
    tokenIn: Address;
    amountIn: string;
    tokenMintSy: Address;
    bulk: boolean;
}

interface TokenOutput {
    tokenOut: Address;
    minTokenOut: string;
    bulk: boolean;
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

        await notify('Preparing to mint SY from token...');
        const tx = {
            target: SY,
            data: {
                abi: actionMiscAbi,
                functionName: 'mintSyFromToken',
                args: [receiver, SY, minSyOut, input]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: 'Successfully minted SY from token'
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

        await notify('Preparing to redeem SY to token...');
        const tx = {
            target: SY,
            data: {
                abi: actionMiscAbi,
                functionName: 'redeemSyToToken',
                args: [receiver, SY, netSyIn, output]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: 'Successfully redeemed SY to token'
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
): Promise<Result<string>> {
    try {
        validateAddress(receiver);
        validateAddress(YT);
        validateAddress(input.tokenIn);
        validateAddress(input.tokenMintSy);

        await notify('Preparing to mint PY from token...');
        const tx = {
            target: YT,
            data: {
                abi: actionMiscAbi,
                functionName: 'mintPyFromToken',
                args: [receiver, YT, minPyOut, input]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: 'Successfully minted PY from token'
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
} 