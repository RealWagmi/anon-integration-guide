import BeefyClient from '../helpers/beefyClient';

interface Options {
    address: string;
    timeout?: string;
}

export async function getAddressTimeline(options: Options): Promise<void> {
    try {
        const { address } = options;
        const timeout = options.timeout ? parseInt(options.timeout, 10) : undefined;
        const client = new BeefyClient(timeout);
        const data = await client.getAddressTimeline(address);
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error fetching address timeline:', error);
        process.exit(1);
    }
}
