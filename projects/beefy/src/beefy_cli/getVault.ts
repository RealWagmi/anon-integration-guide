import { getSimplifiedVaultByIdAndChain } from '../helpers/vaults';

interface Options {
    id: string;
    chain: string;
}

export async function getVault(options: Options): Promise<void> {
    try {
        const data = await getSimplifiedVaultByIdAndChain(options.id, options.chain);
        if (!data) {
            console.error('Vault not found');
            process.exit(0);
        }
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error fetching vault:', error);
        process.exit(1);
    }
}
