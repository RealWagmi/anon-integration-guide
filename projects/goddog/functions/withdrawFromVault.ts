import { VaultParams, FunctionReturn } from './types';
import { HeyAnonSDK } from '@heyanon/sdk';

export async function withdrawFromVault(
    params: VaultParams & { shareAmount: string; recipient: string },
    sdk: HeyAnonSDK
): Promise<FunctionReturn> {
    try {
        const { account, vaultAddress, shareAmount, recipient, chainId } = params;
        
        // Withdraw from vault
        const tx = await sdk.vault.withdraw({
            account,
            vault: vaultAddress,
            shares: shareAmount,
            recipient,
            chainId
        });

        return {
            message: `Successfully withdrew ${shareAmount} shares from vault`,
            error: false
        };
    } catch (error) {
        if (error instanceof Error) {
            return {
                message: `Failed to withdraw from vault: ${error.message}`,
                error: true
            };
        }
        return {
            message: 'Failed to withdraw from vault: Unknown error',
            error: true
        };
    }
} 