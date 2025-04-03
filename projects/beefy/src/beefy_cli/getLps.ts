import BeefyClient from '../helpers/beefyClient';

interface Options {
    timeout?: string;
}

export async function getLps(options: Options): Promise<void> {
    try {
        const timeout = options.timeout ? parseInt(options.timeout, 10) : undefined;
        const client = new BeefyClient(timeout);
        const data = await client.getLps();
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error fetching LPs:', error);
        process.exit(1);
    }
}
