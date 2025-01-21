import { type Address } from 'viem';
import { type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress } from '../../utils/validation';
import { marketFactoryAbi } from '../../abis';

export async function isValidMarket(
    market: Address,
    { getProvider }: { getProvider: Function }
): Promise<Result<boolean>> {
    try {
        validateAddress(market);

        const provider = getProvider();
        const result = await provider.readContract({
            address: 'marketFactory',
            abi: marketFactoryAbi,
            functionName: 'isValidMarket',
            args: [market]
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