import { describe, it, expect, vi } from 'vitest';
import { ethers } from 'ethers';
import { getSwapLiquidity, marketSwap, limitSwap } from './';

// Mock contracts
const mockVaultContract = {
  poolAmounts: vi.fn(),
  reservedAmounts: vi.fn(),
  getMaxPrice: vi.fn(),
  getAmountOut: vi.fn(),
};

const mockRouterContract = {
  swap: vi.fn(),
  createSwapOrder: vi.fn(),
};

// Mock provider and signer
const mockProvider = {
  getNetwork: vi.fn(),
} as unknown as ethers.providers.Provider;

const mockSigner = {
  getAddress: vi.fn(),
} as unknown as ethers.Signer;

// Mock transaction response
const mockTxResponse = {
  wait: vi.fn().mockResolvedValue({
    transactionHash: '0x123',
    events: [
      {
        event: 'CreateSwapOrder',
        args: { orderId: '0x456' }
      }
    ]
  }),
};

describe('Swap Functions', () => {
  describe('getSwapLiquidity', () => {
    it('should return correct liquidity info', async () => {
      const poolAmount = ethers.BigNumber.from('1000000');
      const reservedAmount = ethers.BigNumber.from('200000');
      const maxPrice = ethers.BigNumber.from('5000000');

      vi.spyOn(ethers, 'Contract').mockImplementation(() => mockVaultContract);
      mockVaultContract.poolAmounts.mockResolvedValue(poolAmount);
      mockVaultContract.reservedAmounts.mockResolvedValue(reservedAmount);
      mockVaultContract.getMaxPrice.mockResolvedValue(maxPrice);

      const result = await getSwapLiquidity({
        provider: mockProvider,
        vaultAddress: '0x123',
        tokenIn: '0x456',
        tokenOut: '0x789'
      });

      expect(result.poolAmount).toEqual(poolAmount);
      expect(result.reservedAmount).toEqual(reservedAmount);
      expect(result.maxInAmount).toEqual(maxPrice);
      expect(result.maxOutAmount).toEqual(poolAmount.sub(reservedAmount));
    });
  });

  describe('marketSwap', () => {
    it('should execute market swap successfully', async () => {
      const amountIn = ethers.BigNumber.from('1000000');
      const minAmountOut = ethers.BigNumber.from('900000');
      const expectedOut = ethers.BigNumber.from('950000');

      vi.spyOn(ethers, 'Contract')
        .mockImplementationOnce(() => mockRouterContract)
        .mockImplementationOnce(() => mockVaultContract);

      mockVaultContract.getAmountOut.mockResolvedValue([expectedOut]);
      mockRouterContract.swap.mockResolvedValue(mockTxResponse);
      mockSigner.getAddress.mockResolvedValue('0x123');

      const result = await marketSwap({
        signer: mockSigner,
        routerAddress: '0x123',
        vaultAddress: '0x456',
        tokenIn: '0x789',
        tokenOut: '0xabc',
        amountIn,
        minAmountOut
      });

      expect(result.amountIn).toEqual(amountIn);
      expect(result.amountOut).toEqual(expectedOut);
      expect(result.transactionHash).toBe('0x123');
    });

    it('should throw error if slippage too high', async () => {
      const amountIn = ethers.BigNumber.from('1000000');
      const minAmountOut = ethers.BigNumber.from('950000');
      const expectedOut = ethers.BigNumber.from('900000');

      vi.spyOn(ethers, 'Contract')
        .mockImplementationOnce(() => mockRouterContract)
        .mockImplementationOnce(() => mockVaultContract);

      mockVaultContract.getAmountOut.mockResolvedValue([expectedOut]);

      await expect(marketSwap({
        signer: mockSigner,
        routerAddress: '0x123',
        vaultAddress: '0x456',
        tokenIn: '0x789',
        tokenOut: '0xabc',
        amountIn,
        minAmountOut
      })).rejects.toThrow('Insufficient output amount, slippage too high');
    });
  });

  describe('limitSwap', () => {
    it('should create limit order successfully', async () => {
      const params = {
        signer: mockSigner,
        routerAddress: '0x123',
        tokenIn: '0x456',
        tokenOut: '0x789',
        amountIn: ethers.BigNumber.from('1000000'),
        minAmountOut: ethers.BigNumber.from('900000'),
        triggerPrice: ethers.BigNumber.from('1100000'),
        triggerAboveThreshold: true,
        executionFee: ethers.BigNumber.from('1000000000')
      };

      vi.spyOn(ethers, 'Contract').mockImplementation(() => mockRouterContract);
      mockRouterContract.createSwapOrder.mockResolvedValue(mockTxResponse);

      const result = await limitSwap(params);

      expect(result.orderId).toBe('0x456');
      expect(result.transactionHash).toBe('0x123');
    });
  });
}); 