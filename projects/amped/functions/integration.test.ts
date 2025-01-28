import { describe, it, expect, beforeAll } from 'vitest';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { FunctionOptions } from '@heyanon/sdk';
import {
  getApr,
  getEarnings,
  claimRewards
} from './liquidity/index.js';
import {
  getSwapLiquidity,
  marketSwap,
  limitSwap
} from './trading/swaps/index.js';
import {
  getLeverageLiquidity,
  marketPosition,
  limitPosition
} from './trading/leverage/index.js';

// Contract addresses for Amped Finance on Sonic
const ADDRESSES = {
  vault: '0x11944027D4eDC1C17db2D5E9020530dcEcEfb85b' as const,
  router: '0x96EFEcB86b3408de4F92454E30a0c99E58299F35' as const,
  positionRouter: '0x82546eCf796C28882d98FfF8aB9FC109DC86221a' as const,
  rewardTracker: '0xb382901Ff357afb612e3E239656fc5F2FDe250dc' as const, // StakedGMX
  rewardDistributor: '0x921eC8dac46C42dE63705AB91e4Ef5dE0A2cd732' as const, // StakedGMX Distributor
  tokens: {
    WETH: '0x50c42deacd8fc9773493ed674b675be577f2634b' as const,
    USDC: '0x29219dd400f2bf60e5a23d13be72b486d4038894' as const,
    ANON: '0xAc611438AE5F3953DeDB47c2ea8d6650D601C1B4' as const, // GMX token
  }
};

describe('Amped Finance Integration Tests', () => {
  let publicClient: any;
  let walletClient: any;
  let account: any;
  let sdkOptions: FunctionOptions;

  beforeAll(async () => {
    // Create account from private key
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY environment variable is required');
    }
    account = privateKeyToAccount(privateKey as `0x${string}`);

    // Create public client
    publicClient = createPublicClient({
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
          default: { http: ['https://rpc.sonic.fantom.network'] }
        }
      },
      transport: http()
    });

    // Create wallet client
    walletClient = createWalletClient({
      account,
      chain: publicClient.chain,
      transport: http()
    });

    // Create SDK options
    sdkOptions = {
      getProvider: () => publicClient,
      sendTransactions: async (props: any): Promise<any> => {
        const { transactions } = props;
        const results = [];
        for (const tx of transactions) {
          const hash = await walletClient.sendTransaction(tx);
          results.push({ hash });
        }
        return { data: results };
      },
      notify: async (message: string) => {
        console.log('Notification:', message);
      }
    };
  });

  describe('Liquidity Functions', () => {
    it('should get APR information', async () => {
      const result = await getApr({
        chainName: 'sonic',
        account: account.address,
        tokenAddress: ADDRESSES.tokens.ANON
      }, sdkOptions);

      expect(result.data).toBeDefined();
    });

    it('should get earnings information', async () => {
      const result = await getEarnings({
        chainName: 'sonic',
        account: account.address,
        tokenAddress: ADDRESSES.tokens.ANON
      }, sdkOptions);

      expect(result.data).toBeDefined();
    });

    it('should claim rewards', async () => {
      const result = await claimRewards({
        chainName: 'sonic',
        account: account.address,
        tokenAddress: ADDRESSES.tokens.ANON
      }, sdkOptions);

      expect(result.data).toBeDefined();
    });
  });

  describe('Trading Functions', () => {
    it('should get swap liquidity information', async () => {
      const result = await getSwapLiquidity({
        chainName: 'sonic',
        account: account.address,
        tokenIn: ADDRESSES.tokens.USDC as `0x${string}`,
        tokenOut: ADDRESSES.tokens.WETH as `0x${string}`,
        amountIn: 1000000n // 1 USDC
      }, sdkOptions);

      expect(result.data).toBeDefined();
    });

    it('should execute market swap', async () => {
      const result = await marketSwap({
        chainName: 'sonic',
        account: account.address,
        tokenIn: ADDRESSES.tokens.USDC as `0x${string}`,
        tokenOut: ADDRESSES.tokens.WETH as `0x${string}`,
        amountIn: 1000000n, // 1 USDC
        minAmountOut: 0n
      }, sdkOptions);

      expect(result.data).toBeDefined();
    });

    it('should get leverage liquidity information', async () => {
      const result = await getLeverageLiquidity({
        chainName: 'sonic',
        account: account.address,
        indexToken: ADDRESSES.tokens.WETH as `0x${string}`,
        collateralToken: ADDRESSES.tokens.WETH as `0x${string}`,
        isLong: true
      }, sdkOptions);

      expect(result.data).toBeDefined();
    });

    it('should open market position', async () => {
      const result = await marketPosition({
        chainName: 'sonic',
        account: account.address,
        indexToken: ADDRESSES.tokens.WETH as `0x${string}`,
        collateralToken: ADDRESSES.tokens.WETH as `0x${string}`,
        isLong: true,
        size: 1000000000000000000n, // 1 ETH
        collateral: 100000000000000000n, // 0.1 ETH
        leverage: 10,
        executionFee: 1000000000000000n // 0.001 ETH
      }, sdkOptions);

      expect(result.data).toBeDefined();
    });
  });
}); 