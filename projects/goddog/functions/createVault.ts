import { VaultParams, FunctionReturn } from './types';
import { HeyAnonSDK } from '@heyanon/sdk';

export async function createVault(
    params: VaultParams,
    sdk: HeyAnonSDK
): Promise<FunctionReturn> {
    try {
        const { account, poolAddress, agentAddress, chainId } = params;
        
        // Create new vault
        const tx = await sdk.vault.create({
            account,
            pool: poolAddress,
            agent: agentAddress,
            chainId
        });

        return {
            message: `Successfully created vault for pool ${poolAddress}`,
            error: false
        };
    } catch (error) {
        if (error instanceof Error) {
            return {
                message: `Failed to create vault: ${error.message}`,
                error: true
            };
        }
        return {
            message: 'Failed to create vault: Unknown error',
            error: true
        };
    }
} 