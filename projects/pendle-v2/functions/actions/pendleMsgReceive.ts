import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';

const pendleMsgReceiveEndpointAbi = [
    {
        name: 'calcFee',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'dstAddress', type: 'address' },
            { name: 'dstChainId', type: 'uint256' },
            { name: 'payload', type: 'bytes' },
            { name: 'estimatedGasAmount', type: 'uint256' }
        ],
        outputs: [{ type: 'uint256' }]
    },
    {
        name: 'sendMessage',
        type: 'function',
        stateMutability: 'payable',
        inputs: [
            { name: 'dstAddress', type: 'address' },
            { name: 'dstChainId', type: 'uint256' },
            { name: 'payload', type: 'bytes' },
            { name: 'estimatedGasAmount', type: 'uint256' }
        ],
        outputs: []
    },
    {
        name: 'executeMessage',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'message', type: 'bytes' }
        ],
        outputs: []
    }
];

export interface SendMessageParams {
    dstAddress: Address;
    dstChainId: number;
    payload: string;
    estimatedGasAmount: number;
}

export async function calcMessageFee(
    endpointAddress: Address,
    params: SendMessageParams,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(endpointAddress);
        validateAddress(params.dstAddress);

        const provider = getProvider();
        const fee = await provider.readContract({
            address: endpointAddress,
            abi: pendleMsgReceiveEndpointAbi,
            functionName: 'calcFee',
            args: [params.dstAddress, params.dstChainId, params.payload, params.estimatedGasAmount]
        });

        return {
            success: true,
            data: fee.toString()
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error : new Error('Unknown error occurred')
        };
    }
}

export async function sendMessage(
    endpointAddress: Address,
    params: SendMessageParams,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(endpointAddress);
        validateAddress(params.dstAddress);

        // Calculate fee first
        const feeResult = await calcMessageFee(endpointAddress, params, { getProvider });
        if (!feeResult.success) {
            throw new Error(`Failed to calculate fee: ${feeResult.error}`);
        }

        // Prepare transaction
        await notify('Preparing to send cross-chain message...');
        const tx = {
            target: endpointAddress,
            data: {
                abi: pendleMsgReceiveEndpointAbi,
                functionName: 'sendMessage',
                args: [params.dstAddress, params.dstChainId, params.payload, params.estimatedGasAmount]
            },
            value: feeResult.data // Include the calculated fee
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: 'Cross-chain message sent successfully'
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error : new Error('Unknown error occurred')
        };
    }
}

export async function executeMessage(
    endpointAddress: Address,
    message: string,
    { sendTransactions, notify }: { sendTransactions: Function, notify: Function }
): Promise<Result<string>> {
    try {
        validateAddress(endpointAddress);

        // Prepare transaction
        await notify('Preparing to execute message...');
        const tx = {
            target: endpointAddress,
            data: {
                abi: pendleMsgReceiveEndpointAbi,
                functionName: 'executeMessage',
                args: [message]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: 'Message executed successfully'
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error : new Error('Unknown error occurred')
        };
    }
} 