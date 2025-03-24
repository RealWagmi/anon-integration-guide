import { _getAllVaults } from './_getAllVaults';

export async function _getVaultAddress(vaultName: string): Promise<any> {
    const vaults = await _getAllVaults();
    for (const vault of vaults) {
        if (vault.name == vaultName) return vault.vaultAddress;
    }
    return null;
}