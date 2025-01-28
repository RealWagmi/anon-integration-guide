const { createPublicClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { getLiquidity } = require('../../functions/trading/leverage/getLiquidity');
const { CONTRACT_ADDRESSES, NETWORKS, RPC_URLS } = require('../../constants');
require('dotenv/config');

async function main() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY environment variable is required');
  }

  // Create account from private key
  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

  // Create public client
  const publicClient = createPublicClient({
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

  // Create SDK options
  const sdkOptions = {
    getProvider: () => publicClient,
    sendTransactions: async (props: any): Promise<any> => {
      // Since getLiquidity is read-only, we don't actually need to send transactions
      // Just return a mock success response
      return {
        isMultisig: false,
        data: [{
          message: "Mock transaction for read-only operation",
          hash: "0x0000000000000000000000000000000000000000000000000000000000000000"
        }]
      };
    },
    notify: async (message: string) => {
      console.log('Notification:', message);
    }
  };

  try {
    // Check liquidity for S token (both long and short)
    console.log('\nChecking S token long liquidity...');
    const longResult = await getLiquidity(
      {
        chainName: 'sonic',
        account: account.address,
        indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
        collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
        isLong: true
      },
      sdkOptions
    );

    console.log('Long liquidity result:', longResult);

    console.log('\nChecking S token short liquidity...');
    const shortResult = await getLiquidity(
      {
        chainName: 'sonic',
        account: account.address,
        indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
        collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
        isLong: false
      },
      sdkOptions
    );

    console.log('Short liquidity result:', shortResult);
  } catch (error) {
    console.error('Error:', error);
  }
}

main().catch(console.error); 
