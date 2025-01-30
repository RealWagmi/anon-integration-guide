import { Connection } from '@solana/web3.js';
import { AccountMonitor } from '../services/accountMonitor';
import { TestLogger } from '../services/logger';
import { AssetType } from '../types';

describe('AccountMonitor', () => {
    let testLogger: TestLogger;
    let monitor: AccountMonitor;
    const mockRpcUrl = 'http://localhost:8899';

    // Use regular numbers instead of BigInt for mocking
    const mockCustodyData = {
        assets: {
            owned: 1000000,
            locked: 800000
        },
        jumpRateState: {
            targetUtilizationRate: 8000,
            minRateBps: 1000,
            maxRateBps: 20000,
            targetRateBps: 5000
        }
    };

    beforeEach(() => {
        testLogger = new TestLogger();
        jest.clearAllMocks();
    });

    afterEach(async () => {
        if (monitor) {
            // Clear subscriptions before stopping
            monitor['subscriptions'].clear();
            await monitor.stop();
        }
    });

    it('should handle connection failures gracefully', async () => {
        const mockError = new Error('Connection failed');
        jest.spyOn(Connection.prototype, 'getAccountInfo').mockRejectedValue(mockError);
        jest.spyOn(Connection.prototype, 'onAccountChange').mockReturnValue(1);
        
        monitor = new AccountMonitor(mockRpcUrl, testLogger);
        await monitor.start();

        expect(testLogger.logs.some(log => 
            log.level === 'error' && 
            log.message.includes('Error setting up monitor for')
        )).toBeTruthy();
    });

    it('should log successful monitor setup', async () => {
        monitor = new AccountMonitor(mockRpcUrl, testLogger);
        
        // Mock methods before starting monitor
        jest.spyOn(Connection.prototype, 'getAccountInfo').mockResolvedValue({
            data: Buffer.alloc(0),
            executable: false,
            lamports: 1000000,
            owner: 'mockOwner'
        } as any);
        
        jest.spyOn(Connection.prototype, 'onAccountChange').mockReturnValue(1);
        
        await monitor.start();
        
        expect(testLogger.logs).toContainEqual({
            level: 'info',
            message: 'Starting account monitor...',
            args: []
        });
    });

    it('should process rate updates', async () => {
        monitor = new AccountMonitor(mockRpcUrl, testLogger);
        const mockCallback = jest.fn();

        // Create a Buffer directly instead of using JSON.stringify
        const mockBuffer = Buffer.alloc(1024); // Appropriate size for your data
        
        jest.spyOn(Connection.prototype, 'getAccountInfo').mockResolvedValue({
            data: mockBuffer,
            executable: false,
            lamports: 1000000,
            owner: 'mockOwner'
        } as any);

        jest.spyOn(Connection.prototype, 'onAccountChange').mockReturnValue(1);

        // Mock the deserializeCustody function
        jest.mock('../layouts', () => ({
            deserializeCustody: () => mockCustodyData
        }));

        monitor.onRateUpdate(mockCallback);
        await monitor.start();

        expect(testLogger.logs).toContainEqual({
            level: 'debug',
            message: 'Added new rate update callback',
            args: []
        });
    });

    it('should get current rates', async () => {
        monitor = new AccountMonitor(mockRpcUrl, testLogger);
        
        // Create a Buffer directly
        const mockBuffer = Buffer.alloc(1024); // Appropriate size for your data
        
        jest.spyOn(Connection.prototype, 'getAccountInfo').mockResolvedValue({
            data: mockBuffer,
            executable: false,
            lamports: 1000000,
            owner: 'mockOwner'
        } as any);

        // Mock the deserializeCustody function at the module level
        jest.mock('../layouts', () => ({
            deserializeCustody: () => mockCustodyData
        }));

        const rates = await monitor.getCurrentRates('SOL' as AssetType);
        
        expect(rates).toEqual(expect.objectContaining({
            utilization: expect.any(Number),
            annualRate: expect.any(Number),
            hourlyRate: expect.any(Number),
            timestamp: expect.any(Number)
        }));
    });

    it('should stop monitoring correctly', async () => {
        monitor = new AccountMonitor(mockRpcUrl, testLogger);
        
        // Mock methods
        const mockRemoveListener = jest.fn();
        jest.spyOn(Connection.prototype, 'removeAccountChangeListener')
            .mockImplementation(mockRemoveListener);
        jest.spyOn(Connection.prototype, 'onAccountChange').mockReturnValue(1);
        
        await monitor.start();
        await monitor.stop();

        expect(testLogger.logs).toContainEqual({
            level: 'info',
            message: 'Stopping account monitor...',
            args: []
        });
    });
});