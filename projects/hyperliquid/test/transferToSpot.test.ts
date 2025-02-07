import axios from 'axios';
import { Address } from 'viem';
import { transferToSpot } from '../functions';
import { ARBITRUM_CHAIN_ID } from '../constants';
import { toResult } from '@heyanon/sdk';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('transferToSpot', () => {
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
        amount: '100',
    };

    it('should prepare and send transfer transaction correctly', async () => {
        const mockSignTypedDatas = jest.fn((...args: unknown[]) => {
            console.log('Signing typed datas:', args);
            return Promise.resolve([
                '0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c',
            ] as `0x${string}`[]);
        });

        mockedAxios.post.mockResolvedValue({
            data: {
                status: 'ok',
            },
        });

        const result = await transferToSpot(props, {
            notify: mockNotify,
            signTypedDatas: mockSignTypedDatas,
            getProvider: mockProvider,
            sendTransactions: jest.fn(),
        });

        expect(result.success).toEqual(true);
        expect(result.data).toContain('Successfully initiated transfer of 100 USDC from perp to spot on Hyperliquid.');

        expect(mockNotify).toHaveBeenCalledWith('Preparing to transfer funds between spot and perp balances on Hyperliquid...');
        expect(mockedAxios.post).toHaveBeenCalledWith(
            'https://api.hyperliquid.xyz/exchange',
            expect.objectContaining({
                action: expect.any(Object),
                nonce: expect.any(Number),
                signature: expect.any(Object),
            }),
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );
    });

    it('should handle signature without v parameter', async () => {
        const mockSignTypedDatas = jest
            .fn()
            .mockResolvedValue([
                '0x7f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc501',
            ] as `0x${string}`[]);

        mockedAxios.post.mockResolvedValue({
            data: {
                status: 'ok',
            },
        });

        const result = await transferToSpot(props, {
            notify: mockNotify,
            signTypedDatas: mockSignTypedDatas,
            getProvider: mockProvider,
            sendTransactions: jest.fn(),
        });

        expect(result.success).toEqual(true);
    });

    it('should return error if amount is invalid (non-numeric)', async () => {
        const result = await transferToSpot(
            { ...props, amount: 'invalid-amount' },
            {
                notify: mockNotify,
                signTypedDatas: jest.fn(),
                getProvider: mockProvider,
                sendTransactions: jest.fn(),
            },
        );

        expect(result).toEqual(toResult('Invalid amount specified', true));
    });

    it('should return error if amount is less than or equal to zero', async () => {
        const result = await transferToSpot(
            { ...props, amount: '-100' },
            {
                notify: mockNotify,
                signTypedDatas: jest.fn(),
                getProvider: mockProvider,
                sendTransactions: jest.fn(),
            },
        );

        expect(result).toEqual(toResult('Invalid amount specified', true));
    });

    it('should return error if signTypedDatas is not available', async () => {
        const result = await transferToSpot(props, {
            notify: mockNotify,
            signTypedDatas: undefined,
            getProvider: mockProvider,
            sendTransactions: jest.fn(),
        });

        expect(result).toEqual(toResult('Failed to transfer funds between spot and perp balances on Hyperliquid. Please try again.', true));
    });

    it('should return error if axios post request fails', async () => {
        const mockSignTypedDatas = jest.fn((...args: unknown[]) => {
            console.log('Signing typed datas:', args);
            return Promise.resolve([
                '0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c',
            ] as `0x${string}`[]);
        });

        mockedAxios.post.mockRejectedValue(new Error('Network error'));

        const result = await transferToSpot(props, {
            notify: mockNotify,
            signTypedDatas: mockSignTypedDatas,
            getProvider: mockProvider,
            sendTransactions: jest.fn(),
        });

        expect(result).toEqual(toResult('Failed to transfer funds between spot and perp balances on Hyperliquid. Please try again.', true));
    });

    it('should return error for non-ok API response', async () => {
        const mockSignTypedDatas = jest
            .fn()
            .mockResolvedValue([
                '0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c',
            ] as `0x${string}`[]);

        mockedAxios.post.mockResolvedValue({
            data: {
                status: 'error',
                message: 'Some error',
            },
        });

        const result = await transferToSpot(props, {
            notify: mockNotify,
            signTypedDatas: mockSignTypedDatas,
            getProvider: mockProvider,
            sendTransactions: jest.fn(),
        });

        expect(result).toEqual(toResult('Failed to transfer funds between spot and perp balances on Hyperliquid. Please try again.', true));
    });

    it('should validate different amount formats', async () => {
        const testCases = [
            { amount: '100', expectedSuccess: true, message: 'Successfully initiated transfer of 100 USDC from perp to spot on Hyperliquid.' },
            { amount: '0', expectedSuccess: false, message: 'Invalid amount specified' },
            { amount: '-50', expectedSuccess: false, message: 'Invalid amount specified' },
            { amount: 'abc', expectedSuccess: false, message: 'Invalid amount specified' },
        ];

        for (const testCase of testCases) {
            const mockSignTypedDatas = jest.fn((...args: unknown[]) => {
                console.log('Signing typed datas:', args);
                return Promise.resolve([
                    '0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c',
                ] as `0x${string}`[]);
            });

            if (testCase.expectedSuccess) {
                mockedAxios.post.mockResolvedValue({
                    data: {
                        status: 'ok',
                    },
                });
            } else {
                mockedAxios.post.mockRejectedValue(new Error('Network error'));
            }

            const result = await transferToSpot(
                { ...props, amount: testCase.amount },
                {
                    notify: mockNotify,
                    signTypedDatas: mockSignTypedDatas,
                    getProvider: mockProvider,
                    sendTransactions: jest.fn(),
                },
            );

            if (testCase.expectedSuccess) {
                expect(result.success).toEqual(true);
                expect(result.data).toContain(testCase.message);
            } else {
                expect(result).toEqual(toResult(testCase.message, true));
            }
        }
    });
});
