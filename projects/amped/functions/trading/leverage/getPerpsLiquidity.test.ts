import { describe, it, expect, beforeAll } from 'vitest';
import { createPublicClient, http } from 'viem';
import { FunctionOptions, FunctionReturn } from '@heyanon/sdk';
import { getPerpsLiquidity } from './getPerpsLiquidity.js';
import { CONTRACT_ADDRESSES, NETWORKS, CHAIN_CONFIG } from '../../../constants.js';

describe('getPerpsLiquidity', () => {
  let publicClient: any;
  let sdkOptions: FunctionOptions;
  const testAccount = '0x1234567890123456789012345678901234567890';

  beforeAll(() => {
    // Create public client
    publicClient = createPublicClient({
      chain: CHAIN_CONFIG[NETWORKS.SONIC],
      transport: http()
    });

    // Create SDK options
    sdkOptions = {
      getProvider: () => publicClient,
      notify: async (message: string) => {
        console.log('Notification:', message);
      },
      sendTransactions: async () => {
        throw new Error('sendTransactions should not be called in this test');
      }
    };
  });

  it('should get liquidity information for WETH long position', async () => {
    const result = await getPerpsLiquidity({
      chainName: 'sonic',
      account: testAccount as `0x${string}`,
      indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
      collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
      isLong: true
    }, sdkOptions);

    expect(result.isError).toBe(false);
    
    const data = JSON.parse(result.data);
    expect(data).toMatchObject({
      maxLeverage: expect.any(Number),
      maxPositionSize: expect.any(String),
      maxCollateral: expect.any(String),
      poolAmount: expect.any(String),
      reservedAmount: expect.any(String),
      availableLiquidity: expect.any(String),
      fundingRate: expect.any(String),
      priceUsd: expect.any(String)
    });

    // Validate numeric values
    expect(Number(data.maxLeverage)).toBe(11); // Long positions have 11x max leverage
    expect(Number(data.poolAmount)).toBeGreaterThan(0);
    expect(Number(data.priceUsd)).toBeGreaterThan(0);
  });

  it('should get liquidity information for WETH short position', async () => {
    const result = await getPerpsLiquidity({
      chainName: 'sonic',
      account: testAccount as `0x${string}`,
      indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
      collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
      isLong: false
    }, sdkOptions);

    expect(result.isError).toBe(false);
    
    const data = JSON.parse(result.data);
    expect(data).toMatchObject({
      maxLeverage: expect.any(Number),
      maxPositionSize: expect.any(String),
      maxCollateral: expect.any(String),
      poolAmount: expect.any(String),
      reservedAmount: expect.any(String),
      availableLiquidity: expect.any(String),
      fundingRate: expect.any(String),
      priceUsd: expect.any(String)
    });

    // Validate numeric values
    expect(Number(data.maxLeverage)).toBe(10); // Short positions have 10x max leverage
    expect(Number(data.poolAmount)).toBeGreaterThan(0);
    expect(Number(data.priceUsd)).toBeGreaterThan(0);
  });

  it('should return error for unsupported chain', async () => {
    const result = await getPerpsLiquidity({
      chainName: 'ethereum',
      account: testAccount as `0x${string}`,
      indexToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH,
      collateralToken: CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC,
      isLong: true
    }, sdkOptions);

    expect(result.isError).toBe(true);
    expect(result.data).toBe('This function is only supported on Sonic chain');
  });

  it('should handle invalid token addresses', async () => {
    const result = await getPerpsLiquidity({
      chainName: 'sonic',
      account: testAccount as `0x${string}`,
      indexToken: '0x0000000000000000000000000000000000000000',
      collateralToken: '0x0000000000000000000000000000000000000000',
      isLong: true
    }, sdkOptions);

    expect(result.isError).toBe(true);
    expect(result.data).toContain('Failed to get perpetual trading liquidity');
  });
}); 
