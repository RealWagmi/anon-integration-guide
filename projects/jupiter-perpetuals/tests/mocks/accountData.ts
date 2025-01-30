import { Buffer } from 'buffer';
import { BN } from 'bn.js';

// Helper function to create Buffer from u64
const u64ToBuffer = (num: number): Buffer => {
    return new BN(num).toArrayLike(Buffer, 'le', 8);
};

// Helper function to create mock account data
export function createMockCustodyAccount({
    owned = 1000000,
    locked = 500000,
    minRate = 1000, // 10% in BPS
    maxRate = 20000, // 200% in BPS
    targetRate = 5000, // 50% in BPS
    targetUtilization = 8000, // 80% in BPS
} = {}) {
    // Create a buffer large enough for the entire account data
    const buffer = Buffer.alloc(1024); // Adjust size as needed
    let offset = 0;

    // Mock pool, mint, and token account (32 bytes each of zeros is fine for testing)
    offset += 96; // 32 * 3

    // decimals (1 byte)
    buffer[offset] = 9;
    offset += 1;

    // isStable (1 byte)
    buffer[offset] = 0;
    offset += 1;

    // Assets
    u64ToBuffer(0).copy(buffer, offset); // feesReserves
    offset += 8;
    u64ToBuffer(owned).copy(buffer, offset); // owned
    offset += 8;
    u64ToBuffer(locked).copy(buffer, offset); // locked
    offset += 8;
    u64ToBuffer(0).copy(buffer, offset); // guaranteedUsd
    offset += 8;
    u64ToBuffer(0).copy(buffer, offset); // globalShortSizes
    offset += 8;
    u64ToBuffer(0).copy(buffer, offset); // globalShortAveragePrices
    offset += 8;

    // FundingRateState
    u64ToBuffer(0).copy(buffer, offset); // cumulativeInterestRate
    offset += 8;
    u64ToBuffer(Date.now()).copy(buffer, offset); // lastUpdated
    offset += 8;
    u64ToBuffer(0).copy(buffer, offset); // hourlyFundingDbps
    offset += 8;

    // JumpRateState
    u64ToBuffer(minRate).copy(buffer, offset); // minRateBps
    offset += 8;
    u64ToBuffer(maxRate).copy(buffer, offset); // maxRateBps
    offset += 8;
    u64ToBuffer(targetRate).copy(buffer, offset); // targetRateBps
    offset += 8;
    u64ToBuffer(targetUtilization).copy(buffer, offset); // targetUtilizationRate
    offset += 8;

    return buffer;
}

// Example test cases
export const mockAccountScenarios = {
    normalUtilization: createMockCustodyAccount({
        owned: 1000000,
        locked: 500000, // 50% utilization
    }),
    highUtilization: createMockCustodyAccount({
        owned: 1000000,
        locked: 900000, // 90% utilization
    }),
    lowUtilization: createMockCustodyAccount({
        owned: 1000000,
        locked: 100000, // 10% utilization
    }),
    zeroUtilization: createMockCustodyAccount({
        owned: 1000000,
        locked: 0, // 0% utilization
    }),
    fullUtilization: createMockCustodyAccount({
        owned: 1000000,
        locked: 1000000, // 100% utilization
    })
};

export * from './accountData';