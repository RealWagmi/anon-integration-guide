import { Connection } from '@solana/web3.js';
import type { FunctionReturn } from '@heyanon/sdk';
import { getBorrowRates } from '../functions/getBorrowRates';
import { CUSTODY_ACCOUNTS } from '../types';
import { createMockCustodyAccount } from './mocks/accountData';

// Mock @solana/web3.js
jest.mock('@solana/web3.js', () => ({
    Connection: jest.fn(),
    PublicKey: jest.fn().mockImplementation((address) => ({ toBase58: () => address }))
}));

describe('getBorrowRates', () => {
    const mockAccountData = createMockCustodyAccount({
        owned: 1000000,
        locked: 500000,      // 50% utilization
        minRate: 1000,       // 10% annual rate
        maxRate: 20000,      // 200% annual rate
        targetRate: 5000,    // 50% annual rate
        targetUtilization: 8000 // 80% target utilization
    });

    beforeEach(() => {
        // Reset mocks
        (Connection as jest.Mock).mockClear();
        
        // Setup default mock implementations
        (Connection as jest.Mock).mockImplementation(() => ({
            getAccountInfo: jest.fn().mockResolvedValue({
                data: mockAccountData,
                executable: false,
                lamports: 1000000,
                owner: CUSTODY_ACCOUNTS.SOL,
            })
        }));
    });

    it('should return borrow rates for valid asset', async () => {
        const result: FunctionReturn = await getBorrowRates({ asset: 'SOL' });
        expect(result.success).toBe(true);
        
        const data = JSON.parse(result.data);
        expect(data).toHaveProperty('asset', 'SOL');
        expect(data).toHaveProperty('utilization');
        expect(data).toHaveProperty('annualRate');
        expect(data).toHaveProperty('hourlyRate');
        expect(data).toHaveProperty('timestamp');
        
        // Test specific values based on our mock data
        expect(data.utilization).toBe(50); // 50% utilization
        expect(data.annualRate).toBeCloseTo(35, 1); // Should be around 35% with our mock values
        // 35% because: minRate(10%) + (targetRate(50%) - minRate(10%)) * (utilization(50%) / targetUtilization(80%))
    });

    it('should handle invalid assets', async () => {
        // @ts-ignore - Testing invalid input
        const result: FunctionReturn = await getBorrowRates({ asset: 'INVALID' });
        expect(result.success).toBe(false);
        expect(result.data).toContain('Invalid asset');
    });

    it('should handle RPC errors', async () => {
        // Mock RPC failure
        (Connection as jest.Mock).mockImplementation(() => ({
            getAccountInfo: jest.fn().mockRejectedValue(new Error('RPC Error'))
        }));

        const result: FunctionReturn = await getBorrowRates({ asset: 'SOL' });
        expect(result.success).toBe(false);
        expect(result.data).toContain('Error fetching borrow rates');
    });

    it('should handle missing account data', async () => {
        // Mock missing account
        (Connection as jest.Mock).mockImplementation(() => ({
            getAccountInfo: jest.fn().mockResolvedValue(null)
        }));

        const result: FunctionReturn = await getBorrowRates({ asset: 'SOL' });
        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to fetch account info');
    });

    it('should calculate rates correctly for different utilization levels', async () => {
        // Test with 90% utilization (above target)
        const highUtilData = createMockCustodyAccount({
            owned: 1000000,
            locked: 900000,      // 90% utilization
            minRate: 1000,       // 10% in BPS
            maxRate: 20000,      // 200% in BPS
            targetRate: 5000,    // 50% in BPS
            targetUtilization: 8000  // 80% in BPS
        });

        (Connection as jest.Mock).mockImplementation(() => ({
            getAccountInfo: jest.fn().mockResolvedValue({
                data: highUtilData,
                executable: false,
                lamports: 1000000,
                owner: CUSTODY_ACCOUNTS.SOL,
            })
        }));

        const result = await getBorrowRates({ asset: 'SOL' });
        expect(result.success).toBe(true);
        
        const data = JSON.parse(result.data);
        expect(data.utilization).toBe(90);
        expect(data.annualRate).toBeCloseTo(87.5, 1);
        expect(data.hourlyRate).toBeCloseTo(data.annualRate / 8760, 5);
    });
});