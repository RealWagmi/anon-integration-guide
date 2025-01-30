import { Connection } from '@solana/web3.js';
import { AccountMonitor } from '../services/accountMonitor';
import { mockAccountScenarios } from './mocks/accountData';
import { CUSTODY_ACCOUNTS } from '../types';

// Mock @solana/web3.js
jest.mock('@solana/web3.js', () => ({
    Connection: jest.fn(),
    PublicKey: jest.fn().mockImplementation((address) => ({ toBase58: () => address }))
}));

describe('AccountMonitor', () => {
    let monitor: AccountMonitor;
    let mockConnection: jest.Mocked<Connection>;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup mock connection
        mockConnection = {
            onAccountChange: jest.fn().mockReturnValue(1),
            removeAccountChangeListener: jest.fn(),
            getAccountInfo: jest.fn().mockResolvedValue({
                data: mockAccountScenarios.normalUtilization,
                executable: false,
                lamports: 1000000,
                owner: 'owner',
            }),
        } as unknown as jest.Mocked<Connection>;

        (Connection as jest.Mock).mockImplementation(() => mockConnection);

        // Create monitor instance
        monitor = new AccountMonitor();
    });

    afterEach(() => {
        monitor.stop();
    });

    it('should initialize correctly', () => {
        expect(monitor).toBeDefined();
        expect(Connection).toHaveBeenCalled();
    });

    it('should start monitoring accounts', async () => {
        await monitor.start();

        expect(mockConnection.onAccountChange).toHaveBeenCalledTimes(Object.keys(CUSTODY_ACCOUNTS).length);
        expect(mockConnection.getAccountInfo).toHaveBeenCalledTimes(Object.keys(CUSTODY_ACCOUNTS).length);
    });

    it('should handle rate callbacks', async () => {
        const callback = jest.fn();
        monitor.onRateUpdate(callback);

        // Simulate account update
        const mockAccountChange = {
            data: mockAccountScenarios.normalUtilization,
            executable: false,
            lamports: 1000000,
            owner: 'owner',
        };

        await monitor.start();

        // Get the callback passed to onAccountChange
        const accountChangeCallback = (mockConnection.onAccountChange as jest.Mock).mock.calls[0][1];
        
        // Simulate account change
        accountChangeCallback(mockAccountChange, { slot: 1 });

        expect(callback).toHaveBeenCalled();
        const [_, rates] = callback.mock.calls[0];
        
        expect(rates).toHaveProperty('utilization');
        expect(rates).toHaveProperty('annualRate');
        expect(rates).toHaveProperty('hourlyRate');
        expect(rates).toHaveProperty('timestamp');
    });

    it('should calculate rates correctly for different utilization levels', async () => {
        const callback = jest.fn();
        monitor.onRateUpdate(callback);

        const testScenarios = [
            { name: 'normal', data: mockAccountScenarios.normalUtilization },
            { name: 'high', data: mockAccountScenarios.highUtilization },
            { name: 'low', data: mockAccountScenarios.lowUtilization },
            { name: 'zero', data: mockAccountScenarios.zeroUtilization },
            { name: 'full', data: mockAccountScenarios.fullUtilization },
        ];

        for (const scenario of testScenarios) {
            const mockAccountChange = {
                data: scenario.data,
                executable: false,
                lamports: 1000000,
                owner: 'owner',
            };

            await monitor.start();
            const accountChangeCallback = (mockConnection.onAccountChange as jest.Mock).mock.calls[0][1];
            accountChangeCallback(mockAccountChange, { slot: 1 });

            expect(callback).toHaveBeenCalled();
            const [_, rates] = callback.mock.lastCall;
            
            expect(rates.utilization).toBeGreaterThanOrEqual(0);
            expect(rates.utilization).toBeLessThanOrEqual(100);
            expect(rates.annualRate).toBeGreaterThanOrEqual(0);
            expect(rates.hourlyRate).toBeGreaterThanOrEqual(0);
        }
    });

    it('should handle cleanup correctly', async () => {
        await monitor.start();
        monitor.stop();

        expect(mockConnection.removeAccountChangeListener).toHaveBeenCalledTimes(Object.keys(CUSTODY_ACCOUNTS).length);
    });

    it('should prevent duplicate starts', async () => {
        await monitor.start();
        await monitor.start(); // Second start should be ignored

        expect(mockConnection.onAccountChange).toHaveBeenCalledTimes(Object.keys(CUSTODY_ACCOUNTS).length);
    });

    it('should handle connection errors gracefully', async () => {
        mockConnection.getAccountInfo.mockRejectedValueOnce(new Error('Connection failed'));

        await monitor.start();
        // Should not throw error and continue with other accounts
        expect(mockConnection.onAccountChange).toHaveBeenCalled();
    });
});