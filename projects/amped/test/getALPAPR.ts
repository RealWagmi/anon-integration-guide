import { createPublicClient, http } from 'viem';
import { getALPAPR } from '../src/functions/liquidity/getALPAPR.js';
import { CHAIN_CONFIG, NETWORKS } from '../src/constants.js';

async function main() {
  // Create a client for testing
  const publicClient = createPublicClient({
    chain: CHAIN_CONFIG[NETWORKS.SONIC],
    transport: http(),
  });

  // Test account - replace with a valid one if needed
  const account = '0xd99c871c8130b03c8bb597a74fb5eaa7a46864bb';

  console.log('Testing getALPAPR on Sonic network...');
  
  try {
    // Call the function
    const result = await getALPAPR(
      {
        chainName: NETWORKS.SONIC,
        account,
        publicClient,
      },
      {
        notify: async (message) => {
          console.log(`Notification: ${message}`);
          return { error: false };
        },
      }
    );

    // Log the results
    console.log('\nFunction returned:', result.error ? 'ERROR' : 'SUCCESS');
    if (result.error) {
      console.error(result.result);
    } else {
      const data = JSON.parse(result.result);
      console.log('\nALP APR Information:');
      console.log('-------------------');
      console.log(`Base APR: ${data.baseApr}%`);
      console.log(`Total Supply: ${data.totalSupply} ALP`);
      console.log(`Total Supply Value: $${data.totalSupplyUsd}`);
      console.log(`ALP Price: $${data.alpPrice}`);
      console.log(`Yearly Rewards: ${data.yearlyRewards} ${data.rewardTokenSymbol} ($${data.yearlyRewardsUsd})`);
      console.log(`Daily Rewards: $${data.dailyRewardsUsd}`);
      console.log(`Weekly Rewards: $${data.weeklyRewardsUsd}`);
    }
  } catch (err) {
    console.error('Test error:', err);
  }
}

main().catch(console.error); 