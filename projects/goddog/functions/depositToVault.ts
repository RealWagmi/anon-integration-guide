import { VaultParams, FunctionReturn } from './types';
import { HeyAnonSDK } from '@heyanon/sdk';

export async function depositToVault(
    params: VaultParams & { amount0: string; amount1: string; recipient: string },
    sdk: HeyAnonSDK
): Promise<FunctionReturn> {
    try {
        const { account, vaultAddress, amount0, amount1, recipient, chainId } = params;
        
        // Deposit to vault
        const tx = await sdk.vault.deposit({
            account,
            vault: vaultAddress,
            amount0,
            amount1,
            recipient,
            chainId
        });

        return {
            message: `Successfully deposited ${amount0} token0 and ${amount1} token1 to vault`,
            error: false
        };
    } catch (error) {
        if (error instanceof Error) {
            return {
                message: `Failed to deposit to vault: ${error.message}`,
                error: true
            };
        }
        return {
            message: 'Failed to deposit to vault: Unknown error',
            error: true
        };
    }
} 