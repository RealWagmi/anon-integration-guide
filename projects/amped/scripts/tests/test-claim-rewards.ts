import { claimRewards } from '../../functions/liquidity/claimRewards.js';
import { getEarnings } from '../../functions/liquidity/getEarnings.js';
import { PublicClient, createPublicClient, http, Chain, formatUnits, createWalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { FunctionOptions, TransactionReturn } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { createInterface } from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import 'dotenv/config';

// Define Sonic chain
export const sonic = {
    id: 146,
    name: 'Sonic',
    nativeCurrency: {
        decimals: 18,
        name: 'Sonic',
        symbol: 'SONIC',
    },
    rpcUrls: {
        default: { http: ['https://rpc.soniclabs.com'] },
        public: { http: ['https://rpc.soniclabs.com'] }
    },
    blockExplorers: {
        default: { name: 'SonicScan', url: 'https://explorer.sonic.oasys.games' }
    }
} as const satisfies Chain;

async function test() {
    // Check for private key in environment
    if (!process.env.PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY environment variable is required');
    }

    // Create account from private key
    const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
    console.log('Using wallet address:', account.address);

    const transport = http('https://rpc.soniclabs.com');
    
    const provider = createPublicClient({
        chain: sonic,
        transport
    });

    // Create wallet client for sending transactions
    const walletClient = createWalletClient({
        chain: sonic,
        transport,
        account
    });

    const options: FunctionOptions = {
        notify: async (msg: string) => console.log('Notification:', msg),
        getProvider: (chainId: number): PublicClient => {
            if (chainId !== 146) throw new Error('Invalid chain ID');
            return provider;
        },
        sendTransactions: async ({ chainId, account: _, transactions }): Promise<TransactionReturn> => {
            if (!transactions || transactions.length === 0) {
                throw new Error('No transactions provided');
            }

            const tx = transactions[0];
            if (!tx.target || !tx.data) {
                throw new Error('Invalid transaction parameters');
            }

            console.log('\nTransaction Details:');
            console.log('-------------------');
            console.log('To:', tx.target);
            console.log('Value:', (tx.value ?? 0n).toString());
            console.log('Data:', tx.data);
            
            try {
                const hash = await walletClient.sendTransaction({
                    to: tx.target,
                    value: tx.value ?? 0n,
                    data: tx.data
                });

                return {
                    data: [{
                        hash,
                        message: 'Transaction submitted successfully'
                    }],
                    isMultisig: false
                };
            } catch (error) {
                console.error('Transaction failed:', error);
                throw error;
            }
        }
    };

    // First check current earnings
    console.log('\nChecking current earnings...');
    const earningsResult = await getEarnings(
        {
            chainName: 'sonic',
            account: account.address
        },
        options
    );

    if (!earningsResult.success) {
        console.log('Error getting earnings:', earningsResult.data);
        return;
    }

    const earningsInfo = JSON.parse(earningsResult.data);
    console.log('\nCurrent Earnings:');
    console.log('----------------');
    console.log(`Claimable Rewards: ${formatUnits(BigInt(earningsInfo.claimableRewards), 18)} wS`);
    console.log(`Reward Value: $${formatUnits(BigInt(earningsInfo.rewardValueUsd), 18)}`);

    // If there are rewards to claim, claim them
    if (BigInt(earningsInfo.claimableRewards) > 0n) {
        console.log('\nAttempting to claim rewards...');
        const claimResult = await claimRewards(
            {
                chainName: 'sonic',
                account: account.address
            },
            options
        );

        if (!claimResult.success) {
            console.log('Error claiming rewards:', claimResult.data);
        } else {
            const claimInfo = JSON.parse(claimResult.data);
            console.log('\nClaim Result:');
            console.log('-------------');
            console.log('Status:', claimInfo.success ? 'Success' : 'Failed');
            console.log('Amount Claimed:', formatUnits(BigInt(claimInfo.claimableAmount), 18), 'wS');
            console.log('Transaction Hash:', claimInfo.txHash);
            console.log('\nMessage:', claimInfo.message);

            // Wait for transaction confirmation
            console.log('\nWaiting for transaction confirmation...');
            const receipt = await provider.waitForTransactionReceipt({ hash: claimInfo.txHash });
            console.log('Transaction confirmed in block:', receipt.blockNumber);
            console.log('Gas used:', receipt.gasUsed.toString());
        }
    } else {
        console.log('\nNo rewards available to claim.');
    }
}

test().catch(console.error); 