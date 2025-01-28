import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { addLiquidity } from '../projects/amped/functions/liquidity/index.js';
import { CONTRACT_ADDRESSES, NETWORKS, RPC_URLS } from '../projects/amped/constants.js';

async function main() {
  // Create test account (replace with actual test private key)
  const testAccount = privateKeyToAccount('0x1234567890123456789012345678901234567890123456789012345678901234');

  // Create wallet client
  const client = createWalletClient({
    account: testAccount,
    chain: {
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
    },
    transport: http()
  });

  console.log('Testing addLiquidity function...');
  console.log('Using contracts:');
  console.log('- GLP Manager:', CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER);
  console.log('- Reward Router:', CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_ROUTER);
  console.log('- RPC URL:', RPC_URLS[NETWORKS.SONIC]);
  console.log('- Test Account:', testAccount.address);

  // Test with native token (S)
  console.log('\nTesting with native token (S):');
  try {
    const nativeResult = await addLiquidity({
      chainName: 'sonic',
      tokenIn: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
      amount: '0.1' // 0.1 S
    }, {
      getProvider: () => client,
      notify: async (msg: string) => console.log('Notification:', msg)
    });

    console.log('\nNative token result:', nativeResult);

    if (!nativeResult.success) {
      console.log('Error:', nativeResult.data);
    } else {
      const data = JSON.parse(nativeResult.data);
      console.log('\nTransaction Data:');
      console.log('- To:', data.to);
      console.log('- Value:', data.value);
      console.log('- USD Value:', data.usdValue);
      console.log('- Min USDG:', data.minUsdg);
      console.log('- Min GLP:', data.minGlp);
    }
  } catch (error) {
    console.error('Error testing native token:', error);
  }

  // Test with USDC
  console.log('\nTesting with USDC:');
  try {
    const usdcResult = await addLiquidity({
      chainName: 'sonic',
      tokenIn: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
      amount: '100' // 100 USDC
    }, {
      getProvider: () => client,
      notify: async (msg: string) => console.log('Notification:', msg)
    });

    console.log('\nUSDC result:', usdcResult);

    if (!usdcResult.success) {
      console.log('Error:', usdcResult.data);
    } else {
      const data = JSON.parse(usdcResult.data);
      console.log('\nTransaction Data:');
      console.log('- To:', data.to);
      console.log('- Value:', data.value);
      console.log('- USD Value:', data.usdValue);
      console.log('- Min USDG:', data.minUsdg);
      console.log('- Min GLP:', data.minGlp);
    }
  } catch (error) {
    console.error('Error testing USDC:', error);
  }
}

main().catch(console.error); 