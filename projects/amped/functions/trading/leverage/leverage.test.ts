import { describe, it, expect, vi } from 'vitest';
import { ethers } from 'ethers';
import { getLeverageLiquidity, marketPosition, limitPosition } from './';

// Mock contracts
const mockVaultContract = {
  poolAmounts: vi.fn(),
  reservedAmounts: vi.fn(),
  maxGlobalLongSizes: vi.fn(),
  maxGlobalShortSizes: vi.fn(),
  cumulativeFundingRates: vi.fn(),
  getPosition: vi.fn(),
};

const mockPositionRouterContract = {
  createIncreasePosition: vi.fn(),
  createDecreasePosition: vi.fn(),
  getRequestQueueLengths: vi.fn(),
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
        event: 'CreateIncreasePosition',
        args: { positionId: '0x456' }
      }
    ]
  }),
};

describe('Leverage Functions', () => {
  describe('getLeverageLiquidity', () => {
    it('should return correct liquidity info', async () => {
      const poolAmount = ethers.BigNumber.from('1000000');
      const reservedAmount = ethers.BigNumber.from('200000');
      const maxLongSize = ethers.BigNumber.from('5000000');
      const maxShortSize = ethers.BigNumber.from('4000000');
      const fundingRate = ethers.BigNumber.from('100');

      vi.spyOn(ethers, 'Contract').mockImplementation(() => mockVaultContract);
      mockVaultContract.poolAmounts.mockResolvedValue(poolAmount);
      mockVaultContract.reservedAmounts.mockResolvedValue(reservedAmount);
      mockVaultContract.maxGlobalLongSizes.mockResolvedValue(maxLongSize);
      mockVaultContract.maxGlobalShortSizes.mockResolvedValue(maxShortSize);
      mockVaultContract.cumulativeFundingRates.mockResolvedValue(fundingRate);

      const result = await getLeverageLiquidity({
        provider: mockProvider,
        vaultAddress: '0x123',
        indexToken: '0x456',
        collateralToken: '0x789',
        isLong: true
      });

      expect(result.maxLeverage).toBe(11);
      expect(result.maxPositionSize).toEqual(maxLongSize);
      expect(result.poolAmount).toEqual(poolAmount);
      expect(result.reservedAmount).toEqual(reservedAmount);
      expect(result.fundingRate).toEqual(fundingRate);
    });
  });

  describe('marketPosition', () => {
    it('should execute market position successfully', async () => {
      const sizeDelta = ethers.BigNumber.from('1000000');
      const collateralDelta = ethers.BigNumber.from('100000');

      vi.spyOn(ethers, 'Contract')
        .mockImplementationOnce(() => mockVaultContract)
        .mockImplementationOnce(() => mockPositionRouterContract);

      mockVaultContract.getPosition.mockResolvedValue([
        ethers.BigNumber.from(0), // size
        ethers.BigNumber.from(0), // collateral
        ethers.BigNumber.from(0), // averagePrice
        ethers.BigNumber.from(0), // entryFundingRate
        ethers.BigNumber.from(0), // reserveAmount
        ethers.BigNumber.from(0), // realisedPnl
        false, // hasProfit
        0 // lastIncreasedTime
      ]);

      mockPositionRouterContract.createIncreasePosition.mockResolvedValue(mockTxResponse);
      mockSigner.getAddress.mockResolvedValue('0x123');

      const result = await marketPosition({
        signer: mockSigner,
        vaultAddress: '0x123',
        positionRouterAddress: '0x456',
        indexToken: '0x789',
        collateralToken: '0xabc',
        isLong: true,
        sizeDelta,
        collateralDelta,
        isIncrease: true
      });

      expect(result.positionId).toBe('0x456');
      expect(result.transactionHash).toBe('0x123');
    });
  });

  describe('limitPosition', () => {
    it('should create limit position successfully', async () => {
      const params = {
        signer: mockSigner,
        positionRouterAddress: '0x123',
        indexToken: '0x456',
        collateralToken: '0x789',
        isLong: true,
        sizeDelta: ethers.BigNumber.from('1000000'),
        collateralDelta: ethers.BigNumber.from('100000'),
        triggerPrice: ethers.BigNumber.from('50000000000'),
        isIncrease: true
      };

      vi.spyOn(ethers, 'Contract').mockImplementation(() => mockPositionRouterContract);
      mockPositionRouterContract.createIncreasePosition.mockResolvedValue(mockTxResponse);
      mockPositionRouterContract.getRequestQueueLengths.mockResolvedValue([1, 0]);
      mockSigner.getAddress.mockResolvedValue('0x123');

      const result = await limitPosition(params);

      expect(result.positionId).toBe('0x456');
      expect(result.transactionHash).toBe('0x123');
    });
  });
}); 