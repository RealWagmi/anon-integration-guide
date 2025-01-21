// src/__tests__/lp.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { blockchain } from '@heyanon/sdk'
import { addLiquidity } from './addLiquidity'
import { getPoolLiquidity } from './getPoolLiquidity'
import { getUserLiquidity } from './getUserLiquidity'
import { removeLiquidity } from './removeLiquidity'

// Mock the blockchain SDK
vi.mock('@heyanon/sdk', () => ({
  blockchain: {
    removeLiquidity: vi.fn().mockResolvedValue({
      txHash: '0x123',
      success: true
    })
  },
  toResult: vi.fn().mockImplementation((message, success) => ({
    success: success ?? true,
    message: message ?? '',
    data: null
  }))
}))

describe('AMP Liquidity Functions', () => {
  // Mock functions for options
  const mockOptions = {
    sendTransactions: vi.fn().mockResolvedValue({
      data: [{ message: 'Transaction successful' }],
      isMultisig: false
    }),
    notify: vi.fn().mockResolvedValue(undefined)
  };

  // Clear mock calls between each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test data setup
  const testPool = {
    id: 'test-pool-1',
    tokenA: 'TOKEN_A',
    tokenB: 'TOKEN_B'
  }
  
  const testUser = 'test-user-address'
  const testAmount = '1000'

  it('should add liquidity with valid parameters', async () => {
    const result = await addLiquidity({
      poolId: testPool.id,
      tokenAAmount: testAmount,
      tokenBAmount: testAmount,
      userAddress: testUser
    })
    
    expect(result).toBeDefined()
    // Add more specific assertions based on your expected return value
  })

  it('should get pool liquidity', async () => {
    const liquidity = await getPoolLiquidity(testPool.id)
    
    expect(liquidity).toBeDefined()
    expect(liquidity).toHaveProperty('tokenAAmount')
    expect(liquidity).toHaveProperty('tokenBAmount')
  })

  it('should get user liquidity position', async () => {
    const userPosition = await getUserLiquidity({
      poolId: testPool.id,
      userAddress: testUser
    })
    
    expect(userPosition).toBeDefined()
    expect(userPosition).toHaveProperty('lpTokens')
  })

  it('should remove liquidity', async () => {
    const testRemoveLiquidityParams = {
      chainName: 'arbitrum',
      account: '0xTestAddress',
      tokenOut: '0xTokenAddress',
      amount: '1000',
      minOut: '950'
    };

    const result = await removeLiquidity(
      testRemoveLiquidityParams,
      mockOptions
    );
    
    expect(result).toBeDefined();
    
    // Instead of checking mockOptions.sendTransactions, let's verify the blockchain SDK was called
    expect(blockchain.removeLiquidity).toHaveBeenCalled();
    expect(blockchain.removeLiquidity).toHaveBeenCalledWith(
      expect.objectContaining({
        chainName: 'arbitrum',
        account: '0xTestAddress',
        tokenOut: '0xTokenAddress',
        amount: '1000',
        minOut: '950'
      })
    );
  })
})