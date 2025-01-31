import { describe, it, expect, beforeAll } from 'vitest';
import { ethers } from 'ethers';
import { config } from 'dotenv';
import { getApr } from './liquidity';

// Load environment variables
config();

// Contract addresses for Amped Finance on Sonic
const ADDRESSES = {
  rewardTracker: '0x21Efb5680d6127d6C39AE0d62D80cb9fc8935887', // FeeGLP
  rewardDistributor: '0x069d9C2eec92f777e80F019f944B9a8f775b3634', // FeeGLP Distributor
  feeStakedTracker: '0xfb0e5AAbFac2f946d6F45fcd4303fF721A4e3237', // FeeStakedGLP
  feeStakedDistributor: '0x9467a227a2697873Fc5226ceC3ae94B319D93CfE', // FeeStakedGLP Distributor
};

describe('APR Test', () => {
  let provider: ethers.providers.Provider;

  beforeAll(() => {
    // Connect to Sonic network
    provider = new ethers.providers.JsonRpcProvider('https://rpc.soniclabs.com');
    console.log('Connected to Sonic network');
  });

  it('should get APR information', async () => {
    console.log('Fetching APR information...');
    
    // Get base APR from FeeGLP tracker
    const baseResult = await getApr(provider, {
      rewardTrackerAddress: ADDRESSES.rewardTracker,
      rewardDistributorAddress: ADDRESSES.rewardDistributor
    });

    // Get staked APR from FeeStakedGLP tracker
    const stakedResult = await getApr(provider, {
      rewardTrackerAddress: ADDRESSES.feeStakedTracker,
      rewardDistributorAddress: ADDRESSES.feeStakedDistributor
    });

    const totalApr = baseResult.totalApr + stakedResult.totalApr;

    console.log('APR Results:', {
      baseApr: baseResult.totalApr + '%',
      stakedApr: stakedResult.totalApr + '%',
      totalApr: totalApr + '%'
    });

    expect(totalApr).toBeGreaterThan(0);
  }, 10000); // Increase timeout to 10 seconds
}); 