import { Address } from 'viem';
import { bridgeToHyperliquid } from '../functions';
import { HYPERLIQUID_BRIDGE_ADDRESS, USDC_ADDRESS, MIN_BRIDGE_AMOUNT, ARBITRUM_CHAIN_ID } from '../constants';
import { toResult, TransactionReturn } from '@heyanon/sdk';
import { TransactionParams } from '@heyanon/sdk/dist/blockchain/types';

const account = '0x92CC36D66e9d739D50673d1f27929a371FB83a67' as Address;

describe('bridgeToHyperliquid', () => {
    const mockNotify = jest.fn((message: string) => {
        console.log(message);
        return Promise.resolve();
    });

    const mockProvider = jest.fn().mockReturnValue({
        readContract: jest.fn(),
        simulateContract: jest.fn(),
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const props = {
        chainName: 'arbitrum-one',
        account: account,
        amount: '100',
    };

    it('should prepare and send bridge transaction correctly', async () => {
        let capturedTransactions: TransactionParams[] = [];
        const mockSendTransactions = jest.fn((props: any): Promise<TransactionReturn> => {
            capturedTransactions = props.transactions;
            return Promise.resolve({
                isMultisig: false,
                data: [{ message: 'Transaction successful', hash: '0x' }],
            });
        });

        jest.spyOn(require('@heyanon/sdk'), 'getChainFromName').mockImplementation((...args: unknown[]) => {
            const chainName = args[0] as string;
            if (chainName === 'arbitrum-one') return ARBITRUM_CHAIN_ID;
            if (chainName === 'ethereum') return 1;
            return null;
        });

        const result = await bridgeToHyperliquid(props, {
            notify: mockNotify,
            sendTransactions: mockSendTransactions,
            getProvider: mockProvider,
        });

        expect(result.success).toEqual(true);
        expect(result.data).toContain('Successfully bridged 100 USDC to Hyperliquid');

        expect(capturedTransactions).toHaveLength(1);
        expect(capturedTransactions[0].target).toEqual(USDC_ADDRESS);
        expect(capturedTransactions[0].data.startsWith('0xa9059cbb')).toBe(true);

        expect(mockNotify).toHaveBeenCalledWith('Preparing to bridge USDC to Hyperliquid...');
        expect(mockNotify).toHaveBeenCalledWith('Waiting for transaction confirmation...');
    });

    it('should handle multisig transactions', async () => {
        const mockSendTransactions = jest.fn((): Promise<TransactionReturn> => {
            return Promise.resolve({
                isMultisig: true,
                data: [{ message: 'Multisig transaction created', hash: '0x' }],
            });
        });

        const result = await bridgeToHyperliquid(props, {
            notify: mockNotify,
            sendTransactions: mockSendTransactions,
            getProvider: mockProvider,
        });

        expect(result.success).toEqual(true);
        expect(result.data).toContain('Multisig transaction created');
    });

    it('should use HYPERLIQUID_BRIDGE_ADDRESS as recipient', async () => {
        let capturedTransactions: TransactionParams[] = [];
        const mockSendTransactions = jest.fn((props: any): Promise<TransactionReturn> => {
            capturedTransactions = props.transactions;
            return Promise.resolve({
                isMultisig: false,
                data: [{ message: 'Transaction successful', hash: '0x' }],
            });
        });

        await bridgeToHyperliquid(
            { ...props, amount: '1000' },
            {
                notify: mockNotify,
                sendTransactions: mockSendTransactions,
                getProvider: mockProvider,
            },
        );

        expect(capturedTransactions).toHaveLength(1);
        const tx = capturedTransactions[0];

        expect(tx.target).toBe(USDC_ADDRESS);

        const txData = tx.data as string;
        const recipientAddress = '0x' + txData.slice(34, 74).toLowerCase();
        expect(recipientAddress.toLowerCase()).toBe(HYPERLIQUID_BRIDGE_ADDRESS.toLowerCase());
    });

    it('should validate different amount formats', async () => {
        const testCases = [
            { amount: '1000', expectedSuccess: true, message: 'Successfully bridged 1000 USDC' },
            { amount: '1000.00', expectedSuccess: true, message: 'Successfully bridged 1000.00 USDC' },
            { amount: '1000.50', expectedSuccess: true, message: 'Successfully bridged 1000.50 USDC' },
            { amount: '0.1', expectedSuccess: false, message: `ERROR: Minimum bridge amount is ${MIN_BRIDGE_AMOUNT} USDC` },
            { amount: '.5', expectedSuccess: false, message: `ERROR: Minimum bridge amount is ${MIN_BRIDGE_AMOUNT} USDC` },
            { amount: '1,000', expectedSuccess: false, message: `ERROR: Minimum bridge amount is ${MIN_BRIDGE_AMOUNT} USDC` },
            { amount: 'abc', expectedSuccess: false, message: 'ERROR: Invalid amount specified' },
            { amount: '-100', expectedSuccess: false, message: `ERROR: Minimum bridge amount is ${MIN_BRIDGE_AMOUNT} USDC` },
        ];

        for (const testCase of testCases) {
            const mockSendTransactions = jest.fn(
                (): Promise<TransactionReturn> =>
                    Promise.resolve({
                        isMultisig: false,
                        data: [{ message: 'Transaction successful', hash: '0x123' as `0x${string}` }],
                    }),
            );

            const result = await bridgeToHyperliquid(
                { ...props, amount: testCase.amount },
                {
                    notify: mockNotify,
                    sendTransactions: mockSendTransactions,
                    getProvider: mockProvider,
                },
            );

            expect(result.success).toEqual(testCase.expectedSuccess);
            if (testCase.expectedSuccess) {
                expect(result.data).toContain(testCase.message);
                expect(mockSendTransactions).toHaveBeenCalledTimes(1);
            } else {
                expect(result.data).toBe(testCase.message);
                expect(mockSendTransactions).not.toHaveBeenCalled();
            }
        }
    });

    it('should return error if wallet is not connected', async () => {
        const result = await bridgeToHyperliquid(
            { ...props, account: '' as Address },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult('Wallet not connected', true));
    });

    it('should return error for unsupported chain', async () => {
        const result = await bridgeToHyperliquid(
            { ...props, chainName: 'ethereum' },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult('Hyperliquid bridge is only supported on Arbitrum', true));
    });

    it('should return error for invalid chain name', async () => {
        const result = await bridgeToHyperliquid(
            { ...props, chainName: 'invalid-chain' },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult('Unsupported chain name: invalid-chain', true));
    });

    it('should return error for invalid amount', async () => {
        const result = await bridgeToHyperliquid(
            { ...props, amount: 'invalid' },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult('Invalid amount specified', true));
    });

    it('should return error for amount below minimum', async () => {
        const result = await bridgeToHyperliquid(
            { ...props, amount: (MIN_BRIDGE_AMOUNT - 1).toString() },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult(`Minimum bridge amount is ${MIN_BRIDGE_AMOUNT} USDC`, true));
    });

    it('should handle transaction errors', async () => {
        const mockSendTransactions = jest.fn(() => {
            throw new Error('Transaction failed');
        });

        const result = await bridgeToHyperliquid(props, {
            notify: mockNotify,
            sendTransactions: mockSendTransactions,
            getProvider: mockProvider,
        });

        expect(result).toEqual(toResult('Failed to bridge funds to Hyperliquid. Please try again.', true));
    });
});
