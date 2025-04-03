import BeefyClient from '../helpers/beefyClient';

interface Options {
    chain: string;
    includeEol?: boolean;
    timeout?: string;
}

export async function getProductsByChain(options: Options): Promise<void> {
    try {
        const { chain, includeEol } = options;
        const timeout = options.timeout ? parseInt(options.timeout, 10) : undefined;
        const client = new BeefyClient(timeout);
        const data = await client.getProductsByChain(chain, includeEol);
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error fetching products by chain:', error);
        process.exit(1);
    }
}
