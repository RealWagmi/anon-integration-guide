import { describe, it, expect, beforeAll } from 'vitest';
import { ethers } from 'ethers';
import { ChainId } from '@heyanon/sdk';
import {
  getApr,
  getEarnings,
  claimRewards
} from './liquidity';
import {
  getSwapLiquidity,
  marketSwap,
  limitSwap
} from './trading/swaps/index';
import {
  getLeverageLiquidity,
  marketPosition,
  limitPosition
} from './trading/leverage/index';

// Contract addresses for Amped Finance on Sonic
const ADDRESSES = {
  vault: '0x11944027D4eDC1C17db2D5E9020530dcEcEfb85b',
  router: '0x96EFEcB86b3408de4F92454E30a0c99E58299F35',
  positionRouter: '0x82546eCf796C28882d98FfF8aB9FC109DC86221a',
  rewardTracker: '0xb382901Ff357afb612e3E239656fc5F2FDe250dc', // StakedGMX
  rewardDistributor: '0x921eC8dac46C42dE63705AB91e4Ef5dE0A2cd732', // StakedGMX Distributor
  tokens: {
    WETH: '0x50c42deacd8fc9773493ed674b675be577f2634b',
    USDC: '0x29219dd400f2bf60e5a23d13be72b486d4038894',
    ANON: '0xAc611438AE5F3953DeDB47c2ea8d6650D601C1B4', // GMX token
  }
};

describe('Amped Finance Integration Tests', () => {
  let provider: ethers.providers.Provider;
  let signer: ethers.Signer;

  beforeAll(async () => {
    // Connect to Sonic network
    provider = new ethers.providers.JsonRpcProvider('https://rpc.sonic.fantom.network');
    
    // You'll need to provide a private key or use a different signer method
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY environment variable is required');
    }
    signer = new ethers.Wallet(privateKey, provider);
  });

  describe('Liquidity Functions', () => {
    it('should get APR information', async () => {
      const result = await getApr({
        provider,
        rewardTrackerAddress: ADDRESSES.rewardTracker,
        rewardDistributorAddress: ADDRESSES.rewardDistributor
      });

      expect(result.baseApr).toBeGreaterThan(0);
      expect(result.totalApr).toBeGreaterThan(0);
    });

    it('should get earnings information', async () => {
      const account = await signer.getAddress();
      const result = await getEarnings({
        provider,
        rewardTrackerAddress: ADDRESSES.rewardTracker,
        account
      });

      expect(result.claimableRewards).toBeDefined();
      expect(result.stakedAmount).toBeDefined();
    });
  });

  describe('Swap Functions', () => {
    it('should get swap liquidity information', async () => {
      const result = await getSwapLiquidity({
        provider,
        vaultAddress: ADDRESSES.vault,
        tokenIn: ADDRESSES.tokens.USDC,
        tokenOut: ADDRESSES.tokens.WETH
      });

      expect(result.maxInAmount).toBeDefined();
      expect(result.maxOutAmount).toBeDefined();
      expect(result.poolAmount).toBeGreaterThan(0);
    });

    it('should execute a market swap', async () => {
      const amountIn = ethers.utils.parseUnits('100', 6); // 100 USDC
      const minAmountOut = ethers.utils.parseEther('0.01'); // Min 0.01 WETH

      const result = await marketSwap({
        signer,
        routerAddress: ADDRESSES.router,
        vaultAddress: ADDRESSES.vault,
        tokenIn: ADDRESSES.tokens.USDC,
        tokenOut: ADDRESSES.tokens.WETH,
        amountIn,
        minAmountOut
      });

      expect(result.transactionHash).toBeDefined();
    });
  });

  describe('Leverage Functions', () => {
    it('should get leverage liquidity information', async () => {
      const result = await getLeverageLiquidity({
        provider,
        vaultAddress: ADDRESSES.vault,
        indexToken: ADDRESSES.tokens.WETH,
        collateralToken: ADDRESSES.tokens.USDC,
        isLong: true
      });

      expect(result.maxLeverage).toBe(11);
      expect(result.maxPositionSize).toBeDefined();
      expect(result.fundingRate).toBeDefined();
    });

    it('should open a leveraged long position', async () => {
      const collateralAmount = ethers.utils.parseUnits('1000', 6); // 1000 USDC
      const leverage = 2; // 2x leverage
      const sizeDelta = collateralAmount.mul(leverage);

      const result = await marketPosition({
        signer,
        vaultAddress: ADDRESSES.vault,
        positionRouterAddress: ADDRESSES.positionRouter,
        indexToken: ADDRESSES.tokens.WETH,
        collateralToken: ADDRESSES.tokens.USDC,
        isLong: true,
        sizeDelta,
        collateralDelta: collateralAmount,
        isIncrease: true
      });

      expect(result.positionId).toBeDefined();
      expect(result.transactionHash).toBeDefined();
    });
  });
}); 