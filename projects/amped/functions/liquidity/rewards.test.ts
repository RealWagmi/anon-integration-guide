import { describe, it, expect, vi } from 'vitest';
import { getContract } from 'viem';
import { getALPAPR, getEarnings, claimRewards } from './index.js';

// Mock contract reads
const mockContractReads = {
  tokensPerInterval: vi.fn(),
  totalSupply: vi.fn(),
  claimable: vi.fn(),
  stakedAmounts: vi.fn()
};

// Mock provider
const mockProvider = {
  readContract: vi.fn()
};

describe('Reward Functions', () => {
  describe('getALPAPR', () => {
    it('should calculate APR correctly', async () => {
      const tokensPerInterval = 1000000n;
      const totalSupply = 10000000n;

      // Mock the contract reads
      mockProvider.readContract
        .mockResolvedValueOnce(tokensPerInterval)  // tokensPerInterval
        .mockResolvedValueOnce(totalSupply);       // totalSupply

      const result = await getALPAPR({
        chainName: 'sonic',
        account: '0x123' as `0x${string}`,
        tokenAddress: '0x456' as `0x${string}`
      }, {
        getProvider: () => mockProvider,
        notify: async (msg: string) => console.log(msg)
      });

      const data = JSON.parse(result.data);
      expect(Number(data.baseApr)).toBeGreaterThan(0);
      expect(Number(data.totalApr)).toBe(Number(data.baseApr) * 3); // Base + staked
    });
  });

  describe('getEarnings', () => {
    it('should return claimable rewards and staked amount', async () => {
      const claimableAmount = 1000000n;
      const stakedAmount = 5000000n;

      // Mock the contract reads
      mockProvider.readContract
        .mockResolvedValueOnce(claimableAmount)  // claimable
        .mockResolvedValueOnce(stakedAmount);    // stakedAmounts

      const result = await getEarnings({
        chainName: 'sonic',
        account: '0x123' as `0x${string}`,
        tokenAddress: '0x456' as `0x${string}`
      }, {
        getProvider: () => mockProvider,
        notify: async (msg: string) => console.log(msg)
      });

      const data = JSON.parse(result.data);
      expect(data.claimableRewards).toBe(claimableAmount.toString());
      expect(data.stakedAmount).toBe(stakedAmount.toString());
    });
  });

  describe('claimRewards', () => {
    it('should claim rewards successfully', async () => {
      const claimableAmount = 1000000n;
      const hash = '0x123' as `0x${string}`;

      // Mock the contract reads and transaction
      mockProvider.readContract.mockResolvedValueOnce(claimableAmount);  // claimable

      const result = await claimRewards({
        chainName: 'sonic',
        account: '0x123' as `0x${string}`,
        tokenAddress: '0x456' as `0x${string}`
      }, {
        getProvider: () => mockProvider,
        sendTransactions: async () => ({ 
          data: [{ hash, message: 'Transaction successful' }],
          isMultisig: false,
          isSuccess: true
        }),
        notify: async (msg: string) => console.log(msg)
      });

      const data = JSON.parse(result.data);
      expect(data.transactionHash).toBe(hash);
      expect(data.claimedAmount).toBe(claimableAmount.toString());
    });
  });
}); 