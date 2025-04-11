import { getAllSimplifiedVaults } from '../helpers/vaults';

interface Options {
    timeout?: string;
}

export async function getSimplifiedVaults(_options: Options): Promise<void> {
    try {
        const data = await getAllSimplifiedVaults();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error fetching vaults:', error);
        process.exit(1);
    }
}
