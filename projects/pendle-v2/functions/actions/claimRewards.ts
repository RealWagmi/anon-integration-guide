import { type Address } from 'viem';
import { type ClaimRewardsParams, type ClaimRewardsCallbacks, type Result } from '../../types';
import { ValidationError } from '../../utils/errors';
import { validateAddress, validateChainName } from '../../utils/validation';

export async function claimRewards(
    params: ClaimRewardsParams,
    callbacks: ClaimRewardsCallbacks
): Promise<Result<string>> {
    try {
        const { chainName, account, marketAddress } = params;
        const { sendTransactions, notify, getProvider } = callbacks;

        // Validate inputs
        validateChainName(chainName);
        validateAddress(account);
        validateAddress(marketAddress);

        // Check if market is expired
        const provider = getProvider();
        const isExpired = await provider.readContract({
            address: marketAddress,
            abi: [{
                name: 'isExpired',
                type: 'function',
                stateMutability: 'view',
                inputs: [],
                outputs: [{ type: 'bool' }]
            }],
            functionName: 'isExpired',
            args: []
        });

        if (isExpired) {
            throw new ValidationError('Market has expired');
        }

        // Prepare transaction
        await notify('Preparing to claim Pendle rewards...');
        const result = await sendTransactions({
            chainName,
            account,
            marketAddress,
            functionName: 'claimRewards'
        });

        await notify('Waiting for transaction confirmation...');
        return {
            success: true,
            data: 'Successfully claimed Pendle rewards'
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
} 