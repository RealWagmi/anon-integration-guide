import { createPublicClient, http, PublicClient } from 'viem';
import { getUserCurrentVaults } from '../helpers/vaults';
import * as chains from 'viem/chains';
import { jsonStringify } from '../helpers/format';
interface Options {
    address: string;
    chain: string;
}

export async function getUserVaults(options: Options): Promise<void> {
    try {
        // Find the chain object that matches the name
        const chain = Object.values(chains).find((chain) => chain.name.toLowerCase() === options.chain.toLowerCase());
        if (!chain) {
            throw new Error(`Chain ${options.chain} not supported by viem`);
        }
        const publicClient = createPublicClient({ chain, transport: http() });
        const data = await getUserCurrentVaults(options.address, publicClient as PublicClient);
        console.log(jsonStringify(data, 2));
    } catch (error) {
        console.error('Error fetching user vaults:', error);
        throw error;
    }
}
