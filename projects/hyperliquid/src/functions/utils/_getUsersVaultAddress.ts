import { Address } from 'viem';
import { _getUsersVaults } from './_getUsersVaults';

export async function _getUsersVaultAddress(userAddress: Address, vaultName: string): Promise<any> {
    const vaults = await _getUsersVaults(userAddress);
    for (const vault of vaults) {
        if (vault.name == vaultName) return vault.address;
    }
    return null;
}
