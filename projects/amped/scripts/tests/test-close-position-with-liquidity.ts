import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACT_ADDRESSES, NETWORKS, CHAIN_CONFIG } from '../../constants.js';
import { closePosition } from '../../functions/trading/leverage/closePosition.js';
import { FunctionOptions, SendTransactionProps, TransactionReturn } from '@heyanon/sdk';
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
    if (!process.env.PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY environment variable is required');
    }

    // Create account from private key
    const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
    console.log('Using wallet address:', account.address);

    // Create clients
    const publicClient = createPublicClient({
        chain: CHAIN_CONFIG[NETWORKS.SONIC],
        transport: http(),
    });

    const walletClient = createWalletClient({
        account,
        chain: CHAIN_CONFIG[NETWORKS.SONIC],
        transport: http(),
    });

    // Validate required parameters
    if (!params.indexToken) {
        throw new Error('--indexToken parameter is required');
    }
    if (!params.collateralToken) {
        throw new Error('--collateralToken parameter is required');
    }

    // Test parameters with command line arguments
    const testParams = {
        chainName: NETWORKS.SONIC as (typeof NETWORKS)[keyof typeof NETWORKS],
        account: account.address,
        indexToken: params.indexToken as `0x${string}`,
        collateralToken: params.collateralToken as `0x${string}`,
        isLong: params.isLong ? params.isLong.toLowerCase() === 'true' : true,
        sizeDelta: params.sizeDelta ? BigInt(params.sizeDelta) : undefined,
        slippageBps: params.slippageBps ? parseInt(params.slippageBps) : 30,
        withdrawETH: params.withdrawETH ? params.withdrawETH.toLowerCase() === 'true' : false,
    };

    // Log test parameters
    console.log('\nTest Parameters:');
    console.log('Index Token:', testParams.indexToken);
    console.log('Collateral Token:', testParams.collateralToken);
    console.log('Position Type:', testParams.isLong ? 'Long' : 'Short');
    console.log('Size to Close:', testParams.sizeDelta ? testParams.sizeDelta.toString() : 'Full Position');
    console.log('Slippage Tolerance:', testParams.slippageBps / 100, '%');
    console.log('Withdraw as Native Token:', testParams.withdrawETH);

    // SDK options with real transaction handling
    const options: FunctionOptions = {
        getProvider: (chainId: number) => publicClient,
        notify: async (message: string) => console.log(message),
        sendTransactions: async (params: SendTransactionProps): Promise<TransactionReturn> => {
            console.log('\nSending transaction...');
            const { transactions } = params;
            const txHashes = [];

            for (const tx of transactions) {
                // Log transaction parameters for debugging
                console.log('\nTransaction Parameters:');
                console.log('To:', tx.target);
                console.log('Value:', tx.value?.toString());
                console.log('Data Length:', tx.data.length);
                console.log('Data:', tx.data);

                try {
                    // Send the transaction
                    const hash = await walletClient.sendTransaction({
                        to: tx.target,
                        value: tx.value || 0n,
                        data: tx.data as `0x${string}`,
                        chain: CHAIN_CONFIG[NETWORKS.SONIC],
                        account,
                    });

                    console.log('Transaction sent:', hash);
                    txHashes.push({ hash, message: 'Transaction sent' });
                } catch (error) {
                    console.error('Transaction failed:', error);
                    throw error;
                }
            }

            return {
                isMultisig: false,
                data: txHashes,
            };
        },
    };

    try {
        console.log('\nAttempting to close position...');
        const result = await closePosition(testParams, options);

        try {
            const response = JSON.parse(result.data);
            if (response.success === false) {
                console.log('Failed to close position:', response.error || result.data);
            } else {
                console.log('\nPosition close request submitted successfully!');
                console.log('Transaction hash:', response.hash);
                console.log('Position details:', response.details);

                // Wait for transaction receipt
                console.log('\nWaiting for transaction confirmation...');
                const receipt = await publicClient.waitForTransactionReceipt({
                    hash: response.hash as `0x${string}`,
                });
                console.log('Transaction confirmed in block:', receipt.blockNumber);

                console.log('\nIMPORTANT: The close position request must be executed by a keeper within:');
                console.log('- 2 blocks (~6 seconds)');
                console.log('- 180 seconds');
                console.log('Otherwise, the request will be cancelled and funds returned (minus gas fees).');
                console.log('\nYou can monitor the position status through the Sonic interface');
            }
        } catch (error) {
            console.log('Failed to parse response:', result.data);
        }
    } catch (error) {
        console.error('Error running test:', error);
    }
}

main().catch(console.error);
