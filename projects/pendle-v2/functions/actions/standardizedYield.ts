import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';

const standardizedYieldAbi = [
    {
        name: 'deposit',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'user', type: 'address' },
            { name: 'tokenIn', type: 'address' },
            { name: 'netTokenIn', type: 'uint256' },
            { name: 'minSharesOut', type: 'uint256' }
        ],
        outputs: [{ type: 'uint256' }]
    },
    {
        name: 'redeem',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'user', type: 'address' },
            { name: 'netSharesIn', type: 'uint256' },
            { name: 'tokenOut', type: 'address' },
            { name: 'minTokenOut', type: 'uint256' },
            { name: 'redeemToNative', type: 'bool' }
        ],
        outputs: [{ type: 'uint256' }]
    }
];

export async function deposit(
    receiver: Address,
    token: Address,
    amount: string,
    minSharesOut: string,
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<string>> {
    try {
        // Input validation
        validateAddress(receiver);
        validateAddress(token);
        
        if (!amount || BigInt(amount) <= BigInt(0)) {
            throw new ValidationError('Amount must be greater than 0');
        }
        
        if (!minSharesOut || BigInt(minSharesOut) <= BigInt(0)) {
            throw new ValidationError('Minimum shares out must be greater than 0');
        }

        // Check if token is valid
        const provider = getProvider();
        const isValid = await provider.readContract({
            functionName: 'isValidTokenIn',
            args: [token]
        });

        if (!isValid) {
            throw new ValidationError('Token is not supported for deposit');
        }

        await notify('Preparing to deposit tokens...');
        const result = await sendTransactions([{
            to: token,
            data: '0x',
            value: '0x0'
        }]);

        return {
            success: true,
            data: result.data
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred during deposit'
        };
    }
}

export async function redeem(
    receiver: Address,
    shares: string,
    token: Address,
    minTokenOut: string,
    shouldUnwrap: boolean,
    { getProvider, sendTransactions, notify }: { getProvider: Function; sendTransactions: Function; notify: Function }
): Promise<Result<string>> {
    try {
        // Input validation
        validateAddress(receiver);
        validateAddress(token);
        
        if (!shares || BigInt(shares) <= BigInt(0)) {
            throw new ValidationError('Shares amount must be greater than 0');
        }
        
        if (!minTokenOut || BigInt(minTokenOut) <= BigInt(0)) {
            throw new ValidationError('Minimum tokens out must be greater than 0');
        }

        // Check if token is valid for redemption
        const provider = getProvider();
        const isValid = await provider.readContract({
            functionName: 'isValidTokenOut',
            args: [token]
        });

        if (!isValid) {
            throw new ValidationError('Token is not supported for redemption');
        }

        // Preview redemption to ensure it will succeed
        const expectedOut = await provider.readContract({
            functionName: 'previewRedeem',
            args: [token, shares]
        });

        if (BigInt(expectedOut) < BigInt(minTokenOut)) {
            throw new ValidationError('Redemption would result in fewer tokens than minimum requested');
        }

        await notify('Preparing to redeem shares...');
        const result = await sendTransactions([{
            to: token,
            data: '0x',
            value: '0x0'
        }]);

        return {
            success: true,
            data: result.data
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred during redemption'
        };
    }
}

export async function getExchangeRate({ getProvider }: { getProvider: Function }): Promise<Result<string>> {
    try {
        const provider = getProvider();
        const rate = await provider.readContract({
            functionName: 'exchangeRate',
            args: undefined
        });

        if (!rate) {
            throw new Error('Failed to fetch exchange rate');
        }

        return {
            success: true,
            data: rate.toString()
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get exchange rate'
        };
    }
}

export async function claimRewards(
    user: Address,
    { getProvider, sendTransactions, notify }: { getProvider: any; sendTransactions: any; notify: any }
): Promise<Result<string[]>> {
    try {
        validateAddress(user);

        const provider = getProvider();
        const tx = await provider.prepareTransaction({
            functionName: 'claimRewards',
            args: [user],
            abi: standardizedYieldAbi,
        });

        const result = await sendTransactions([tx]);
        notify('Successfully claimed rewards');
        return { success: true, data: result };
    } catch (error) {
        return { 
            success: false, 
            error: error instanceof Error ? error : new Error('Unknown error occurred')
        };
    }
}

export async function getAccruedRewards(
    user: Address,
    { getProvider }: { getProvider: Function }
): Promise<Result<string[]>> {
    try {
        validateAddress(user);

        const provider = getProvider();
        const rewards = await provider.readContract({
            functionName: 'accruedRewards',
            args: [user]
        });

        if (!rewards || !Array.isArray(rewards)) {
            throw new Error('Invalid rewards data received');
        }

        return {
            success: true,
            data: rewards.map(r => r.toString())
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get accrued rewards'
        };
    }
}

export async function getRewardTokens({ getProvider }: { getProvider: Function }): Promise<Result<Address[]>> {
    try {
        const provider = getProvider();
        const tokens = await provider.readContract({
            functionName: 'getRewardTokens',
            args: undefined
        });

        if (!tokens || !Array.isArray(tokens)) {
            throw new Error('Invalid reward tokens data received');
        }

        // Validate each token address
        tokens.forEach(token => validateAddress(token as Address));

        return {
            success: true,
            data: tokens as Address[]
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get reward tokens'
        };
    }
}

export async function getYieldToken(
    { getProvider }: { getProvider: any }
): Promise<Result<Address>> {
    try {
        const provider = getProvider();
        const result = await provider.readContract({
            functionName: 'yieldToken',
            abi: standardizedYieldAbi,
        });
        return { success: true, data: result };
    } catch (error) {
        return { 
            success: false, 
            error: error instanceof Error ? error : new Error('Unknown error occurred')
        };
    }
}

export async function getTokensIn(
    { getProvider }: { getProvider: any }
): Promise<Result<Address[]>> {
    try {
        const provider = getProvider();
        const result = await provider.readContract({
            functionName: 'getTokensIn',
            abi: standardizedYieldAbi,
        });
        return { success: true, data: result };
    } catch (error) {
        return { 
            success: false, 
            error: error instanceof Error ? error : new Error('Unknown error occurred')
        };
    }
}

export async function getTokensOut(
    { getProvider }: { getProvider: any }
): Promise<Result<Address[]>> {
    try {
        const provider = getProvider();
        const result = await provider.readContract({
            functionName: 'getTokensOut',
            abi: standardizedYieldAbi,
        });
        return { success: true, data: result };
    } catch (error) {
        return { 
            success: false, 
            error: error instanceof Error ? error : new Error('Unknown error occurred')
        };
    }
}

export async function isValidTokenIn(
    token: Address,
    { getProvider }: { getProvider: any }
): Promise<Result<boolean>> {
    try {
        validateAddress(token);

        const provider = getProvider();
        const result = await provider.readContract({
            functionName: 'isValidTokenIn',
            args: [token],
            abi: standardizedYieldAbi,
        });
        return { success: true, data: result };
    } catch (error) {
        return { 
            success: false, 
            error: error instanceof Error ? error : new Error('Unknown error occurred')
        };
    }
}

export async function isValidTokenOut(
    token: Address,
    { getProvider }: { getProvider: any }
): Promise<Result<boolean>> {
    try {
        validateAddress(token);

        const provider = getProvider();
        const result = await provider.readContract({
            functionName: 'isValidTokenOut',
            args: [token],
            abi: standardizedYieldAbi,
        });
        return { success: true, data: result };
    } catch (error) {
        return { 
            success: false, 
            error: error instanceof Error ? error : new Error('Unknown error occurred')
        };
    }
}

export async function previewDeposit(
    tokenIn: Address,
    netTokenIn: string,
    { getProvider }: { getProvider: any }
): Promise<Result<string>> {
    try {
        validateAddress(tokenIn);

        const provider = getProvider();
        const result = await provider.readContract({
            functionName: 'previewDeposit',
            args: [tokenIn, netTokenIn],
            abi: standardizedYieldAbi,
        });
        return { success: true, data: result.toString() };
    } catch (error) {
        return { 
            success: false, 
            error: error instanceof Error ? error : new Error('Unknown error occurred')
        };
    }
}

export async function previewRedeem(
    tokenOut: Address,
    netSharesIn: string,
    { getProvider }: { getProvider: any }
): Promise<Result<string>> {
    try {
        validateAddress(tokenOut);

        const provider = getProvider();
        const result = await provider.readContract({
            functionName: 'previewRedeem',
            args: [tokenOut, netSharesIn],
            abi: standardizedYieldAbi,
        });
        return { success: true, data: result.toString() };
    } catch (error) {
        return { 
            success: false, 
            error: error instanceof Error ? error : new Error('Unknown error occurred')
        };
    }
} 