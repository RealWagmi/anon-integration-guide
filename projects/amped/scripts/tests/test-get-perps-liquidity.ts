import { createPublicClient, http } from 'viem';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { getPerpsLiquidity } from '../../functions/trading/leverage/getPerpsLiquidity.js';
import { FunctionOptions } from '@heyanon/sdk';

async function main() {
  console.log('Testing getPerpsLiquidity function...\n');

  const provider = createPublicClient({
    chain: {
      id: 146,
      name: 'sonic',
      network: 'sonic',
      nativeCurrency: {
        name: 'Sonic',
        symbol: 'S',
        decimals: 18
      },
      rpcUrls: {
        default: { http: ['https://rpc.soniclabs.com'] }
      }
    },
    transport: http()
  });

  const testAccount = '0x1234567890123456789012345678901234567890';

  // Create SDK options with proper types
  const sdkOptions: FunctionOptions = {
    getProvider: () => provider,
    notify: async (message: string) => {
      console.log(message);
      return Promise.resolve();
    },
    sendTransactions: async () => ({ isMultisig: false, data: [] })
  };

  // Test invalid chain
  console.log('Testing invalid chain:');
  const invalidChainResult = await getPerpsLiquidity({
    chainName: 'ethereum',
    account: testAccount,
    indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
    collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
    isLong: true
  }, sdkOptions);
  console.log('Invalid Chain Result:', invalidChainResult);
  console.log('SDK Compliance - Invalid Chain:', 
    invalidChainResult.success === false && 
    typeof invalidChainResult.data === 'string' &&
    invalidChainResult.data.includes('only supported on Sonic chain')
  );

  // Test invalid account
  console.log('\nTesting invalid account:');
  const invalidAccountResult = await getPerpsLiquidity({
    chainName: 'sonic',
    account: '0x0000000000000000000000000000000000000000',
    indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
    collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
    isLong: true
  }, sdkOptions);
  console.log('Invalid Account Result:', invalidAccountResult);
  console.log('SDK Compliance - Invalid Account:', 
    invalidAccountResult.success === false && 
    typeof invalidAccountResult.data === 'string'
  );

  // Test WETH long position
  console.log('\nTesting WETH long position liquidity:');
  const wethLongResult = await getPerpsLiquidity({
    chainName: 'sonic',
    account: testAccount,
    indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
    collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
    isLong: true
  }, sdkOptions);
  console.log('WETH Long Result:', wethLongResult);
  console.log('SDK Compliance - WETH Long:', 
    wethLongResult.success === true && 
    typeof wethLongResult.data === 'string'
  );

  // Test WETH short position
  console.log('\nTesting WETH short position liquidity:');
  const wethShortResult = await getPerpsLiquidity({
    chainName: 'sonic',
    account: testAccount,
    indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
    collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
    isLong: false
  }, sdkOptions);
  console.log('WETH Short Result:', wethShortResult);
  console.log('SDK Compliance - WETH Short:', 
    wethShortResult.success === true && 
    typeof wethShortResult.data === 'string'
  );

  // Test S token long position
  console.log('\nTesting S token long position liquidity:');
  const sTokenResult = await getPerpsLiquidity({
    chainName: 'sonic',
    account: testAccount,
    indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
    collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
    isLong: true
  }, sdkOptions);
  console.log('S Token Long Result:', sTokenResult);
  console.log('SDK Compliance - S Token:', 
    sTokenResult.success === true && 
    typeof sTokenResult.data === 'string'
  );

  // Test ANON token long position
  console.log('\nTesting ANON token long position liquidity:');
  const anonResult = await getPerpsLiquidity({
    chainName: 'sonic',
    account: testAccount,
    indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
    collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
    isLong: true
  }, sdkOptions);
  console.log('ANON Token Result:', anonResult);
  console.log('SDK Compliance - ANON:', 
    anonResult.success === true && 
    typeof anonResult.data === 'string'
  );

  // Test invalid token
  console.log('\nTesting invalid token:');
  const invalidResult = await getPerpsLiquidity({
    chainName: 'sonic',
    account: testAccount,
    indexToken: '0x0000000000000000000000000000000000000000',
    collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
    isLong: true
  }, sdkOptions);
  console.log('Invalid Token Result:', invalidResult);
  console.log('SDK Compliance - Invalid Token:', 
    invalidResult.success === false && 
    typeof invalidResult.data === 'string' &&
    invalidResult.data.includes('Zero addresses are not valid tokens')
  );
}

main().catch(console.error); 