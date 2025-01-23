import { describe, it, expect, vi } from 'vitest';
import { ethers } from 'ethers';
import { getApr, getEarnings, claimRewards } from './';

// Mock ethers contract
const mockContract = {
  tokensPerInterval: vi.fn(),
  totalSupply: vi.fn(),
  claimable: vi.fn(),
  stakedAmounts: vi.fn(),
  claim: vi.fn(),
  getAddress: vi.fn(),
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
  wait: vi.fn().mockResolvedValue({ transactionHash: '0x123' }),
};

describe('Reward Functions', () => {
  describe('getApr', () => {
    it('should calculate APR correctly', async () => {
      const tokensPerInterval = ethers.BigNumber.from('1000000');
      const totalSupply = ethers.BigNumber.from('10000000');

      vi.spyOn(ethers, 'Contract').mockImplementation(() => mockContract);
      mockContract.tokensPerInterval.mockResolvedValue(tokensPerInterval);
      mockContract.totalSupply.mockResolvedValue(totalSupply);

      const result = await getApr({
        provider: mockProvider,
        rewardTrackerAddress: '0x123',
        rewardDistributorAddress: '0x456',
      });

      expect(result.baseApr).toBeGreaterThan(0);
      expect(result.totalApr).toBe(result.baseApr * 2); // Base + ES rewards
    });
  });

  describe('getEarnings', () => {
    it('should return claimable rewards and staked amount', async () => {
      const claimableAmount = ethers.BigNumber.from('1000000');
      const stakedAmount = ethers.BigNumber.from('5000000');

      vi.spyOn(ethers, 'Contract').mockImplementation(() => mockContract);
      mockContract.claimable.mockResolvedValue(claimableAmount);
      mockContract.stakedAmounts.mockResolvedValue(stakedAmount);

      const result = await getEarnings({
        provider: mockProvider,
        rewardTrackerAddress: '0x123',
        account: '0x789',
      });

      expect(result.claimableRewards).toEqual(claimableAmount);
      expect(result.stakedAmount).toEqual(stakedAmount);
    });
  });

  describe('claimRewards', () => {
    it('should claim rewards successfully', async () => {
      const claimableAmount = ethers.BigNumber.from('1000000');

      vi.spyOn(ethers, 'Contract').mockImplementation(() => mockContract);
      mockContract.claimable.mockResolvedValue(claimableAmount);
      mockContract.claim.mockResolvedValue(mockTxResponse);
      mockSigner.getAddress.mockResolvedValue('0x789');

      const result = await claimRewards({
        signer: mockSigner,
        rewardTrackerAddress: '0x123',
      });

      expect(result.claimedAmount).toEqual(claimableAmount);
      expect(result.transactionHash).toBe('0x123');
    });
  });
}); 