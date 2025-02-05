import { createPublicClient, createWalletClient, http, Address, formatUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CONTRACT_ADDRESSES, NETWORKS, CHAIN_CONFIG } from '../../constants.js';
import { addLiquidity } from '../../functions/liquidity/addLiquidity.js';
import { getUserTokenBalances } from '../../functions/liquidity/getUserTokenBalances.js';
import 'dotenv/config';

// Parse command line arguments
const args = process.argv.slice(2);
const tokenIndex = args.indexOf('--token');
const percentIndex = args.indexOf('--percent');
const tokenSymbol = tokenIndex !== -1 ? args[tokenIndex + 1] as 'S' | 'WS' | 'WETH' | 'ANON' | 'USDC' | 'EURC' : 'S';
const percentOfBalance = percentIndex !== -1 ? Number(args[percentIndex + 1]) : undefined;

async function test() {
    console.log('\nTesting add liquidity...');

    // Check for private key
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('PRIVATE_KEY environment variable is required');
    }

    // Create account and clients
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    console.log('\nWallet Information:');
    console.log('------------------');
    console.log('Address:', account.address);

    const publicClient = createPublicClient({
        chain: CHAIN_CONFIG[NETWORKS.SONIC],
        transport: http(),
    });

    const walletClient = createWalletClient({
        chain: CHAIN_CONFIG[NETWORKS.SONIC],
        transport: http(),
        account,
    });

    try {
        // First check user's token balances
        console.log('\nChecking token balances...');
        const balanceResult = await getUserTokenBalances(
            { chainName: 'sonic', account: account.address as Address },
            {
                getProvider: (_chainId: number) => publicClient,
                notify: async (msg: string) => console.log('Notification:', msg),
                sendTransactions: async () => {
                    throw new Error('Should not be called');
                },
            },
        );

        if (!balanceResult.success) {
            throw new Error(`Failed to get token balances: ${balanceResult.data}`);
        }

        const balanceData = JSON.parse(balanceResult.data);
        console.log('\nCurrent Token Balances:');
        console.log('---------------------');
        for (const token of balanceData.tokens) {
            console.log(`${token.symbol}: ${formatUnits(BigInt(token.balance), token.decimals)} (${token.balanceUsd} USD)`);
        }
        console.log(`Total Balance USD: $${balanceData.totalBalanceUsd}`);

        // Add liquidity with specified token and percentage
        console.log(`\nAdding liquidity with ${tokenSymbol}${percentOfBalance ? ` (${percentOfBalance}% of balance)` : ''}:`);
        console.log('-'.repeat(40));

        const result = await addLiquidity(
            {
                chainName: 'sonic',
                account: account.address as Address,
                tokenSymbol,
                percentOfBalance,
            },
            {
                getProvider: (_chainId: number) => publicClient,
                notify: async (msg: string) => console.log('Notification:', msg),
                sendTransactions: async ({ transactions }) => {
                    const results = [];
                    
                    for (const tx of transactions) {
                        console.log('\nTransaction Details:');
                        console.log('-------------------');
                        console.log('To:', tx.target);
                        console.log('Value:', (tx.value ?? 0n).toString());
                        console.log('Data:', tx.data);

                        const hash = await walletClient.sendTransaction({
                            to: tx.target,
                            data: tx.data,
                            value: tx.value ?? 0n,
                        });

                        console.log('\nTransaction submitted:', hash);

                        // Wait for confirmation
                        console.log('\nWaiting for confirmation...');
                        const receipt = await publicClient.waitForTransactionReceipt({ hash });
                        console.log('\nTransaction Status:');
                        console.log('------------------');
                        console.log('Block Number:', receipt.blockNumber);
                        console.log('Gas Used:', receipt.gasUsed.toString());
                        console.log('Status:', receipt.status === 'success' ? '✅ Success' : '❌ Failed');

                        results.push({
                            hash,
                            message: 'Transaction submitted successfully'
                        });
                    }

                    return {
                        success: true,
                        data: results,
                        isMultisig: false,
                    };
                },
            },
        );

        if (result.success) {
            const details = JSON.parse(result.data);
            console.log('\nLiquidity Addition Result:');
            console.log('------------------------');
            console.log('Status: ✅ Success');
            console.log('Transaction Hash:', details.transactionHash);
            console.log('Token:', details.details.tokenSymbol);
            console.log('Amount Added:', details.details.amount, details.details.tokenSymbol);
            console.log('USD Value:', '$' + details.details.amountUsd);
            console.log('Price Impact:', details.details.priceImpact + '%');
            
            // Add new event data output
            console.log('\nPool State After Addition:');
            console.log('------------------------');
            console.log('Received ALP:', details.details.receivedAlp, 'ALP');
            console.log('AUM in USDG:', '$' + details.details.aumInUsdg);
            console.log('Total ALP Supply:', details.details.glpSupply, 'ALP');
            console.log('USDG Amount:', '$' + details.details.usdgAmount);

            if (details.details.warning) {
                console.log('\n⚠️ Warning:', details.details.warning);
            }
        } else {
            console.error('\nFailed to add liquidity:', result.data);
        }

    } catch (error) {
        console.error('\nUnexpected Error:');
        console.error('----------------');
        if (error instanceof Error) {
            console.error('Message:', error.message);
            console.error('Stack:', error.stack);
        } else {
            console.error('Unknown error:', error);
        }
        process.exit(1);
    }
}

test().catch((error) => {
    console.error('\nFatal error:', error);
    process.exit(1);
});
