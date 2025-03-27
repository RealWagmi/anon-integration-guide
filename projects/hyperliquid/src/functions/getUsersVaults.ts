import { Address } from 'viem';
import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import { _getUsersVaultAddress } from './utils/_getUsersVaultAddress';
import { _getUsersVaults } from './utils/_getUsersVaults';
import { _getAllVaults } from './utils/_getAllVaults';

interface Props {
    account: Address;
    vault?: string;
}

/**
 * Gets the list of all active vaults that user manages.
 *
 * @param account - User's wallet address
 * @param options - SDK function options
 * @returns Promise resolving to function execution result with available perpetual balance
 */
export async function getUsersVaults({ account }: Props, _options: FunctionOptions): Promise<FunctionReturn> {
    try {
        const vaults = (await _getAllVaults()).filter((e: any) => e.leader == account);

        if (!vaults || vaults.length == 0) {
            return toResult("You don't have any vaults");
        }
        vaults.sort((a: any, b: any) => b.createTimeMillis - a.createTimeMillis);

        let result = '';

        for (const vault of vaults) {
            const date = new Date(vault.createTimeMillis).toLocaleDateString();
            result += `\n• ${vault.name} (TVL: $${vault.tvl}) | Created: ${date} | Address: ${vault.vaultAddress}`;
        }

        return toResult(`Here is the list of all the vaults you are leading:${result}`);
    } catch (error) {
        console.log('Perp balance error:', error);
        return toResult(`Failed to fetch vaults: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}
