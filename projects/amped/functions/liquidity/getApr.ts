import { ethers } from 'ethers';
import { RewardTracker } from '../../abis/RewardTracker';
import { RewardDistributor } from '../../abis/RewardDistributor';

// Constants for calculations
const SECONDS_PER_YEAR = 31536000; // 365 * 24 * 60 * 60
const BASIS_POINTS_DIVISOR = 10000;
const NATIVE_TOKEN_DECIMALS = 18;
const NATIVE_TOKEN_PRICE = ethers.utils.parseUnits('1', 30); // $1 with 30 decimals precision

export interface GetAprParams {
  rewardTrackerAddress: string;
  rewardDistributorAddress: string;
}

export interface AprResult {
  baseApr: number;
  stakedApr: number;
  totalApr: number;
}

export async function getApr(
  provider: ethers.providers.Provider,
  params: GetAprParams
): Promise<AprResult> {
  const { rewardTrackerAddress, rewardDistributorAddress } = params;

  const rewardTracker = new ethers.Contract(
    rewardTrackerAddress,
    RewardTracker,
    provider
  );

  const distributor = new ethers.Contract(
    rewardDistributorAddress,
    RewardDistributor,
    provider
  );

  const [tokensPerInterval, totalSupply] = await Promise.all([
    distributor.tokensPerInterval(),
    rewardTracker.totalSupply(),
  ]);

  console.log('Contract values:', {
    tokensPerInterval: tokensPerInterval.toString(),
    totalSupply: totalSupply.toString(),
    secondsPerYear: SECONDS_PER_YEAR,
  });

  // Calculate annual rewards
  const annualRewards = tokensPerInterval.mul(SECONDS_PER_YEAR);
  console.log('Annual rewards:', annualRewards.toString());

  // Calculate APR in basis points (1% = 100 basis points)
  const baseApr = totalSupply.gt(0)
    ? parseFloat(
        ethers.utils.formatUnits(
          annualRewards
            .mul(NATIVE_TOKEN_PRICE)
            .mul(BASIS_POINTS_DIVISOR)
            .div(totalSupply)
            .div(ethers.utils.parseUnits('1', NATIVE_TOKEN_DECIMALS - 4)), // Adjust decimals to get correct percentage scale
          18
        )
      )
    : 0;

  console.log('Base APR:', baseApr);

  return {
    baseApr,
    stakedApr: 0,
    totalApr: baseApr
  };
} 