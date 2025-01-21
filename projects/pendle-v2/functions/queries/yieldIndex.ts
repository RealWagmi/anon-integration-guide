import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';
import { pyIndexAbi } from '../../abis';

export async function getCurrentPYIndex(
    yieldTokenAddress: Address,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(yieldTokenAddress);

        const provider = getProvider();
        const result = await provider.readContract({
            address: yieldTokenAddress,
            abi: pyIndexAbi,
            functionName: 'pyIndexCurrent',
            args: []
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

export async function syToAsset(
    yieldTokenAddress: Address,
    syAmount: string,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(yieldTokenAddress);

        const provider = getProvider();
        const index = await getCurrentPYIndex(yieldTokenAddress, { getProvider });
        
        if (!index.success) {
            throw new Error('Failed to get current PY index');
        }

        const result = await provider.readContract({
            address: yieldTokenAddress,
            abi: pyIndexAbi,
            functionName: 'syToAsset',
            args: [index.data, syAmount]
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

export async function assetToSy(
    yieldTokenAddress: Address,
    assetAmount: string,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(yieldTokenAddress);

        const provider = getProvider();
        const index = await getCurrentPYIndex(yieldTokenAddress, { getProvider });
        
        if (!index.success) {
            throw new Error('Failed to get current PY index');
        }

        const result = await provider.readContract({
            address: yieldTokenAddress,
            abi: pyIndexAbi,
            functionName: 'assetToSy',
            args: [index.data, assetAmount]
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

export async function syToAssetUp(
    yieldTokenAddress: Address,
    syAmount: string,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(yieldTokenAddress);

        const provider = getProvider();
        const index = await getCurrentPYIndex(yieldTokenAddress, { getProvider });
        
        if (!index.success) {
            throw new Error('Failed to get current PY index');
        }

        const result = await provider.readContract({
            address: yieldTokenAddress,
            abi: pyIndexAbi,
            functionName: 'syToAssetUp',
            args: [index.data, syAmount]
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

export async function assetToSyUp(
    yieldTokenAddress: Address,
    assetAmount: string,
    { getProvider }: { getProvider: Function }
): Promise<Result<string>> {
    try {
        validateAddress(yieldTokenAddress);

        const provider = getProvider();
        const index = await getCurrentPYIndex(yieldTokenAddress, { getProvider });
        
        if (!index.success) {
            throw new Error('Failed to get current PY index');
        }

        const result = await provider.readContract({
            address: yieldTokenAddress,
            abi: pyIndexAbi,
            functionName: 'assetToSyUp',
            args: [index.data, assetAmount]
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