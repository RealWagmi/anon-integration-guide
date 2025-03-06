import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Address } from 'viem';
import { bridgeToHyperliquid } from '../bridgeToHyperliquid';
import { HYPERLIQUID_BRIDGE_ADDRESS, USDC_ADDRESS, MIN_BRIDGE_AMOUNT, ARBITRUM_CHAIN_ID } from '../../constants';

const account = '0x92CC36D66e9d739D50673d1f27929a371FB83a67' as Address;

vi.mock('@heyanon/sdk', async (importOriginal) => {
    const originalModule = (await importOriginal()) as Record<string, any>;
    return {
        ...originalModule,
        EVM: {
            ...originalModule.EVM,
            utils: {
                ...originalModule.EVM.utils,
                getChainFromName: vi.fn((chainName: string) => {
                    if (chainName === 'Arbitrum') return ARBITRUM_CHAIN_ID;
                    if (chainName === 'arbitrum-one') return ARBITRUM_CHAIN_ID;
                    if (chainName === 'Ethereum') return 1;
                    return null;
                }),
            },
        },
    };
});

describe('bridgeToHyperliquid', () => {
    const mockNotify = vi.fn((message: string) => Promise.resolve());
    const mockSendTransactions = vi.fn();

    const functionOptions = {
        notify: mockNotify,
        evm: {
            sendTransactions: mockSendTransactions,
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const props = {
        chainName: 'Arbitrum',
        account: account,
        amount: '100',
    };

    it('should prepare and send bridge transaction correctly', async () => {
        let capturedTransactions: any[] = [];
        mockSendTransactions.mockImplementation((props: any) => {
            capturedTransactions = props.transactions;
            return Promise.resolve({
                isMultisig: false,
                data: [{ message: 'Transaction successful', hash: '0x' }],
            });
        });

        const result = await bridgeToHyperliquid(props, functionOptions as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('Successfully bridged 100 USDC to Hyperliquid');

        expect(capturedTransactions).toHaveLength(1);
        expect(capturedTransactions[0].target).toBe(USDC_ADDRESS);
        expect(capturedTransactions[0].data.startsWith('0xa9059cbb')).toBe(true);

        expect(mockNotify).toHaveBeenCalledWith('Preparing to bridge USDC to Hyperliquid...');
        expect(mockNotify).toHaveBeenCalledWith('Waiting for transaction confirmation...');
    });

    it('should handle multisig transactions', async () => {
        mockSendTransactions.mockResolvedValue({
            isMultisig: true,
            data: [{ message: 'Multisig transaction created', hash: '0x' }],
        });

        const result = await bridgeToHyperliquid(props, functionOptions as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('Multisig transaction created');
    });

    it('should use HYPERLIQUID_BRIDGE_ADDRESS as recipient', async () => {
        let capturedTransactions: any[] = [];
        mockSendTransactions.mockImplementation((props: any) => {
            capturedTransactions = props.transactions;
            return Promise.resolve({
                isMultisig: false,
                data: [{ message: 'Transaction successful', hash: '0x' }],
            });
        });

        await bridgeToHyperliquid({ ...props, amount: '1000' }, functionOptions as any);

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
            { amount: '0.1', expectedSuccess: false, message: `Minimum bridge amount is ${MIN_BRIDGE_AMOUNT} USDC` },
            { amount: '.5', expectedSuccess: false, message: `Minimum bridge amount is ${MIN_BRIDGE_AMOUNT} USDC` },
            { amount: '1,000', expectedSuccess: false, message: `Minimum bridge amount is ${MIN_BRIDGE_AMOUNT} USDC` },
            { amount: 'abc', expectedSuccess: false, message: 'Invalid amount specified' },
            { amount: '-100', expectedSuccess: false, message: `Minimum bridge amount is ${MIN_BRIDGE_AMOUNT} USDC` },
        ];

        for (const testCase of testCases) {
            mockSendTransactions.mockReset();
            mockSendTransactions.mockResolvedValue({
                isMultisig: false,
                data: [{ message: 'Transaction successful', hash: '0x123' as `0x${string}` }],
            });

            const result = await bridgeToHyperliquid({ ...props, amount: testCase.amount }, functionOptions as any);

            expect(result.success).toBe(testCase.expectedSuccess);
            if (testCase.expectedSuccess) {
                expect(result.data).toContain(testCase.message);
                expect(mockSendTransactions).toHaveBeenCalledTimes(1);
            } else {
                expect(result.data).toContain(testCase.message);
                expect(mockSendTransactions).not.toHaveBeenCalled();
            }
        }
    });

    it('should return error if wallet is not connected', async () => {
        const result = await bridgeToHyperliquid({ ...props, account: '' as Address }, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Wallet not connected');
    });

    it('should return error for unsupported chain', async () => {
        const result = await bridgeToHyperliquid({ ...props, chainName: 'Ethereum' }, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Hyperliquid bridge is only supported on Arbitrum');
    });

    it('should return error for invalid chain name', async () => {
        const result = await bridgeToHyperliquid({ ...props, chainName: 'invalid-chain' }, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Unsupported chain name: invalid-chain');
    });

    it('should return error for invalid amount', async () => {
        const result = await bridgeToHyperliquid({ ...props, amount: 'invalid' }, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Invalid amount specified');
    });

    it('should return error for amount below minimum', async () => {
        const result = await bridgeToHyperliquid({ ...props, amount: (MIN_BRIDGE_AMOUNT - 1).toString() }, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain(`Minimum bridge amount is ${MIN_BRIDGE_AMOUNT} USDC`);
    });

    it('should handle transaction errors', async () => {
        mockSendTransactions.mockImplementation(() => {
            throw new Error('Transaction failed');
        });

        const result = await bridgeToHyperliquid(props, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to bridge funds to Hyperliquid. Please try again.');
    });
});
