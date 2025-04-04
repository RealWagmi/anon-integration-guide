import BeefyClient from '../helpers/beefyClient';

interface Options {
    timeout?: string;
}

export async function getChains(options: Options): Promise<void> {
    try {
        const timeout = options.timeout ? parseInt(options.timeout, 10) : undefined;
        const client = new BeefyClient(timeout);
        const data = await client.getConfig();
        if (data) {
            console.log(JSON.stringify(Object.keys(data), null, 2));
        } else {
            console.error('No config data found');
        }
    } catch (error) {
        console.error('Error fetching config:', error);
        process.exit(1);
    }
}
