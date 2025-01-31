import { createWalletClient, createPublicClient, http, PublicClient, WalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { addLiquidity } from '../projects/amped/functions/liquidity/addLiquidity.js';
import { getAcceptedTokenBalances } from '../projects/amped/functions/liquidity/getAcceptedTokenBalances.js';
import { CONTRACT_ADDRESSES, NETWORKS, RPC_URLS } from '../projects/amped/constants.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  const privateKey = process.env.TEST_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('TEST_WALLET_PRIVATE_KEY not found in environment variables');
  }

  // Create test account from environment variable
  const testAccount = privateKeyToAccount(privateKey as `0x${string}`);

  // Chain configuration
  const chain = {
    id: 146,
    name: 'Sonic',
    network: 'sonic',
    nativeCurrency: {
      name: 'Sonic',
      symbol: 'S',
      decimals: 18
    },
    rpcUrls: {
      default: { http: [RPC_URLS[NETWORKS.SONIC]] }
    }
  };

  // Create public client for reading
  const publicClient = createPublicClient({
    chain,
    transport: http()
  });

  // Create wallet client for transactions
  const walletClient = createWalletClient({
    account: testAccount,
    chain,
    transport: http()
  });

  console.log('Testing liquidity functions...');
  console.log('Using contracts:');
  console.log('- GLP Manager:', CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER);
  console.log('- Reward Router:', CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_ROUTER);
  console.log('- RPC URL:', RPC_URLS[NETWORKS.SONIC]);
  console.log('- Test Account:', testAccount.address);

  // First, get all token balances
  console.log('\nChecking available token balances:');
  try {
    const balancesResult = await getAcceptedTokenBalances('sonic', {
      getProvider: () => ({ ...publicClient, account: testAccount }),
      notify: async (msg: string) => console.log('Notification:', msg)
    });

    console.log('\nBalances result:', balancesResult);

    if (!balancesResult.success) {
      console.log('Error:', balancesResult.data);
    } else {
      const data = JSON.parse(balancesResult.data);
      console.log('\nAvailable Tokens:');
      for (const token of data.tokens) {
        console.log(`${token.symbol}:`);
        console.log(`- Balance: ${token.balance}`);
        console.log(`- USD Value: $${token.balanceUsd}`);
        console.log(`- Price: $${token.price}`);
      }
      console.log('\nTotal USD Value:', data.totalBalanceUsd);
    }

    // If we have balances, try to add liquidity with ANON
    if (balancesResult.success) {
      const data = JSON.parse(balancesResult.data);
      const anonToken = data.tokens.find((t: any) => t.symbol === 'ANON');
      
      if (!anonToken) {
        console.log('ANON token not found in available tokens');
        return;
      }

      console.log('\nTesting addLiquidity with ANON:');
      try {
        const amount = 0.5; // 0.5 ANON
        console.log(`Using amount: ${amount} ANON`);
        
        const result = await addLiquidity({
          chainName: 'sonic',
          tokenIn: anonToken.address,
          amount: amount.toString()
        }, {
          getProvider: () => ({ ...walletClient, account: testAccount }),
          notify: async (msg: string) => console.log('Notification:', msg)
        });

        if (!result.success) {
          console.log('Error:', result.data);
          return;
        }

        const txData = JSON.parse(result.data);
        
        // If this is an approval transaction, send it first
        if (txData.message.includes('Approve')) {
          console.log('Sending approval transaction...');
          const hash = await walletClient.sendTransaction({
            to: txData.to as `0x${string}`,
            data: txData.data as `0x${string}`,
            value: BigInt(txData.value || '0')
          });
          console.log('Approval transaction sent:', hash);
          
          // Wait for the approval transaction to be mined
          console.log('Waiting for approval confirmation...');
          await publicClient.waitForTransactionReceipt({ hash });
          console.log('Approval confirmed. Now adding liquidity...');
          
          // Try adding liquidity again now that we have approval
          const addResult = await addLiquidity({
            chainName: 'sonic',
            tokenIn: anonToken.address,
            amount: amount.toString()
          }, {
            getProvider: () => ({ ...walletClient, account: testAccount }),
            notify: async (msg: string) => console.log('Notification:', msg)
          });
          
          if (!addResult.success) {
            console.log('Error adding liquidity:', addResult.data);
            return;
          }
          
          const addTxData = JSON.parse(addResult.data);
          console.log('\nLiquidity Addition Transaction Data:');
          console.log('- To:', addTxData.to);
          console.log('- Value:', addTxData.value);
          console.log('- Message:', addTxData.message);
          console.log('- USD Value:', addTxData.usdValue);
          console.log('- Min USDG:', addTxData.minUsdg);
          console.log('- Min GLP:', addTxData.minGlp);
          
          // Send the liquidity addition transaction
          console.log('Sending liquidity addition transaction...');
          const addHash = await walletClient.sendTransaction({
            to: addTxData.to as `0x${string}`,
            data: addTxData.data as `0x${string}`,
            value: BigInt(addTxData.value || '0')
          });
          console.log('Liquidity addition transaction sent:', addHash);
          
          // Wait for the transaction to be mined
          console.log('Waiting for transaction confirmation...');
          await publicClient.waitForTransactionReceipt({ hash: addHash });
          console.log('Liquidity addition confirmed!');
        } else {
          // This is the actual liquidity addition transaction
          console.log('\nSending liquidity addition transaction...');
          const hash = await walletClient.sendTransaction({
            to: txData.to as `0x${string}`,
            data: txData.data as `0x${string}`,
            value: BigInt(txData.value || '0')
          });
          console.log('Transaction sent:', hash);
          
          // Wait for the transaction to be mined
          console.log('Waiting for transaction confirmation...');
          await publicClient.waitForTransactionReceipt({ hash });
          console.log('Transaction confirmed!');
        }
      } catch (error) {
        console.error('Error testing ANON:', error);
      }
    }
  } catch (error) {
    console.error('Error checking balances:', error);
  }
}

main().catch(console.error); 
