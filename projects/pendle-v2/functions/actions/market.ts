import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';

const marketAbi = [
    {
        name: 'addLiquidity',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'receiver', type: 'address' },
            { name: 'netPtDesired', type: 'uint256' },
            { name: 'netSyDesired', type: 'uint256' },
            { name: 'minLpOut', type: 'uint256' }
        ],
        outputs: [{ type: 'uint256' }]
    },
    {
        name: 'removeLiquidity',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'receiver', type: 'address' },
            { name: 'netLpToRemove', type: 'uint256' },
            { name: 'minPtOut', type: 'uint256' },
            { name: 'minSyOut', type: 'uint256' }
        ],
        outputs: [
            { name: 'netPtOut', type: 'uint256' },
            { name: 'netSyOut', type: 'uint256' }
        ]
    }
];

export async function addLiquidity(
    receiver: Address,
    market: Address,
    netPtDesired: string,
    netSyDesired: string,
    minLpOut: string,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(receiver);
        validateAddress(market);

        // Prepare transaction
        await notify('Preparing to add liquidity...');
        const tx = {
            target: market,
            data: {
                abi: marketAbi,
                functionName: 'addLiquidity',
                args: [receiver, netPtDesired, netSyDesired, minLpOut]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

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

export async function removeLiquidity(
    receiver: Address,
    market: Address,
    netLpToRemove: string,
    minPtOut: string,
    minSyOut: string,
    { sendTransactions, notify, getProvider }: { sendTransactions: Function, notify: Function, getProvider: Function }
): Promise<Result<{
    netPtOut: string;
    netSyOut: string;
}>> {
    try {
        validateAddress(receiver);
        validateAddress(market);

        // Prepare transaction
        await notify('Preparing to remove liquidity...');
        const tx = {
            target: market,
            data: {
                abi: marketAbi,
                functionName: 'removeLiquidity',
                args: [receiver, netLpToRemove, minPtOut, minSyOut]
            }
        };

        await notify('Waiting for transaction confirmation...');
        const result = await sendTransactions({ transactions: [tx] });

        return {
            success: true,
            data: {
                netPtOut: result.netPtOut.toString(),
                netSyOut: result.netSyOut.toString()
            }
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