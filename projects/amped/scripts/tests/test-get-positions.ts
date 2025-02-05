import { createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACT_ADDRESSES, NETWORKS, CHAIN_CONFIG } from '../../constants';
import { getPosition } from '../../functions/trading/leverage/getPositions';
import { getAllOpenPositions } from '../../functions/trading/leverage/getAllOpenPositions';
import { FunctionOptions } from '@heyanon/sdk';
import 'dotenv/config';

// Parse command line arguments
const args = process.argv.slice(2);
const params: { [key: string]: string } = {};
for (let i = 0; i < args.length; i += 2) {
    if (args[i].startsWith('--')) {
        params[args[i].slice(2)] = args[i + 1];
    }
}

async function main() {
    try {
        if (!process.env.PRIVATE_KEY) {
            throw new Error('PRIVATE_KEY environment variable is required');
        }

        // Create account from private key
        const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
        console.log('Using wallet address:', account.address);

        // Create public client
        const publicClient = createPublicClient({
            chain: CHAIN_CONFIG[NETWORKS.SONIC],
            transport: http(),
        });

        // SDK options
        const options: FunctionOptions = {
            getProvider: () => publicClient,
            notify: async (message: string) => console.log(message),
            sendTransactions: async ({ chainId, account, transactions }) => {
                return { isMultisig: false, data: [] };
            },
        };

        // If specific token is provided, check just that position
        if (params.indexToken && params.collateralToken) {
            console.log('\nChecking specific position:');
            const isLong = params.isLong ? params.isLong.toLowerCase() === 'true' : true;
            const result = await getPosition(
                {
                    chainName: NETWORKS.SONIC,
                    account: account.address,
                    indexToken: params.indexToken as `0x${string}`,
                    collateralToken: params.collateralToken as `0x${string}`,
                    isLong,
                },
                options,
            );

            if (!result.success) {
                console.error('Error checking position:', result.data);
                return;
            }

            const data = JSON.parse(result.data);
            if (data.success && data.position.size && data.position.size !== '0.0') {
                console.log('\nPosition found:');
                console.log(JSON.stringify(data.position, null, 2));
            } else {
                console.log('\nNo active position found.');
            }
            return;
        }

        // Otherwise, check all positions
        console.log('\nChecking all positions...');

        // Check all long positions
        console.log('\nChecking long positions:');
        const longResult = await getAllOpenPositions(
            {
                chainName: NETWORKS.SONIC,
                account: account.address,
                isLong: true,
            },
            options,
        );

        if (!longResult.success) {
            console.error('Error checking long positions:', longResult.data);
        } else {
            const longData = JSON.parse(longResult.data);
            if (longData.positions.length > 0) {
                console.log('\nActive long positions:');
                console.log(JSON.stringify(longData.positions, null, 2));
            } else {
                console.log('No active long positions found.');
            }
        }

        // Check all short positions
        console.log('\nChecking short positions:');
        const shortResult = await getAllOpenPositions(
            {
                chainName: NETWORKS.SONIC,
                account: account.address,
                isLong: false,
            },
            options,
        );

        if (!shortResult.success) {
            console.error('Error checking short positions:', shortResult.data);
        } else {
            const shortData = JSON.parse(shortResult.data);
            if (shortData.positions.length > 0) {
                console.log('\nActive short positions:');
                console.log(JSON.stringify(shortData.positions, null, 2));
            } else {
                console.log('No active short positions found.');
            }
        }
    } catch (error) {
        console.error('Error in test script:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

main();
