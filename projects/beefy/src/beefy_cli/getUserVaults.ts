import { createPublicClient, http, PublicClient } from 'viem';
import { getUserCurrentVaults } from '../helpers/vaults';
import { jsonStringify } from '../helpers/format';
import { getViemChainFromAnonChainName } from '../helpers/chains';

interface Options {
    address: string;
    chain: string;
}

export async function getUserVaults(options: Options): Promise<void> {
    try {
        // Find the chain object that matches the name
        const chain = getViemChainFromAnonChainName(options.chain);
        const publicClient = createPublicClient({ chain, transport: http() });
        const data = await getUserCurrentVaults(options.address, publicClient as PublicClient);
        console.log(jsonStringify(data, 2));
    } catch (error) {
        console.error('Error fetching user vaults:', error);
        throw error;
    }
}
