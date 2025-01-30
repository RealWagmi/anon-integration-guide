import { deserializeCustody } from '../layouts';
import { mockAccountScenarios, createMockCustodyAccount } from './mocks/accountData';

describe('Layout Deserialization', () => {
    it('should correctly deserialize a custody account with normal utilization', () => {
        const decoded = deserializeCustody(mockAccountScenarios.normalUtilization);
        
        expect(decoded.assets.owned).toBe(1000000);
        expect(decoded.assets.locked).toBe(500000);
        expect(decoded.jumpRateState.minRateBps).toBe(1000);
        expect(decoded.jumpRateState.maxRateBps).toBe(20000);
        expect(decoded.jumpRateState.targetRateBps).toBe(5000);
        expect(decoded.jumpRateState.targetUtilizationRate).toBe(8000);
    });

    it('should handle accounts with zero values', () => {
        const decoded = deserializeCustody(mockAccountScenarios.zeroUtilization);
        
        expect(decoded.assets.owned).toBe(1000000);
        expect(decoded.assets.locked).toBe(0);
        expect(decoded.assets.feesReserves).toBe(0);
        expect(decoded.assets.guaranteedUsd).toBe(0);
    });

    it('should correctly handle custom account data', () => {
        const custom = createMockCustodyAccount({
            owned: 5000000,
            locked: 2500000,
            minRate: 500,
            maxRate: 15000,
            targetRate: 3000,
            targetUtilization: 7000
        });

        const decoded = deserializeCustody(custom);
        
        expect(decoded.assets.owned).toBe(5000000);
        expect(decoded.assets.locked).toBe(2500000);
        expect(decoded.jumpRateState.minRateBps).toBe(500);
        expect(decoded.jumpRateState.maxRateBps).toBe(15000);
        expect(decoded.jumpRateState.targetRateBps).toBe(3000);
        expect(decoded.jumpRateState.targetUtilizationRate).toBe(7000);
    });

    it('should preserve boolean values', () => {
        const decoded = deserializeCustody(mockAccountScenarios.normalUtilization);
        expect(typeof decoded.isStable).toBe('boolean');
    });

    it('should handle numbers without precision loss', () => {
        const largeNumber = 2**53 - 1; // Max safe integer
        const custom = createMockCustodyAccount({
            owned: largeNumber,
            locked: largeNumber / 2
        });

        const decoded = deserializeCustody(custom);
        expect(decoded.assets.owned).toBe(largeNumber);
        expect(decoded.assets.locked).toBe(Math.floor(largeNumber / 2));
    });
});