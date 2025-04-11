import BeefyClient from '../helpers/beefyClient';

interface Options {
    timeout?: string;
}

export async function getPrices(options: Options): Promise<void> {
    try {
        const timeout = options.timeout ? parseInt(options.timeout, 10) : undefined;
        const client = new BeefyClient(timeout);
        const data = await client.getPrices();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error fetching prices:', error);
        process.exit(1);
    }
}
