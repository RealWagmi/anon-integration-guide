import { createPublicClient, http } from 'viem';
import { getALPAPR } from '../projects/amped/functions/liquidity/index.js';
import { CONTRACT_ADDRESSES, NETWORKS, RPC_URLS } from '../projects/amped/constants.js';

async function main() {
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

  // Test account address (can be any valid address)
  const testAccount = '0x1234567890123456789012345678901234567890' as `0x${string}`;

  console.log('Testing ALP APR calculation...');
  console.log('Using contracts:');
  console.log('- GLP Token:', CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_TOKEN);
  console.log('- Reward Router:', CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_ROUTER);
  console.log('- RPC URL:', RPC_URLS[NETWORKS.SONIC]);

  try {
    const result = await getALPAPR({
      chainName: 'sonic',
      account: testAccount,
      tokenAddress: CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_TOKEN
    }, {
      getProvider: () => publicClient,
      notify: async (msg: string) => console.log('Notification:', msg)
    });

    console.log('\nRaw result:', result);

    if (result.data && !result.data.startsWith('ERROR')) {
      const aprInfo = JSON.parse(result.data);
      console.log('\nALP APR Information:');
      console.log('-------------------');
      console.log(`Base APR: ${aprInfo.baseApr}%`);
      console.log(`Staked APR: ${aprInfo.stakedApr}%`);
      console.log(`Total APR: ${aprInfo.totalApr}%`);
    } else {
      console.error('Error:', result.data);
    }
  } catch (error) {
    console.error('Failed to get ALP APR:', error);
  }
}

main().catch(console.error); 