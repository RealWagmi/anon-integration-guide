import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createVault } from '../createVault';
import { toResult } from '@heyanon/sdk';
import { Address } from 'viem';

vi.mock('axios', () => ({
    default: {
        post: vi.fn(),
    },
}));

vi.mock('viem/accounts', () => ({
    generatePrivateKey: vi.fn(() => 'dummy-private-key'),
    privateKeyToAccount: vi.fn(() => ({
        address: '0xAgentWalletAddress',
    })),
}));

vi.mock('../utils/_signL1Action', () => ({
    _signL1Action: vi.fn(() => Promise.resolve('signed-action')),
}));

import axios from 'axios';
const mockedAxios = axios as unknown as { post: ReturnType<typeof vi.fn> };

const defaultProps = {
    account: '0x92CC36D66e9d739D50673d1f27929a371FB83a67' as Address,
    description: 'Vault for ETH trading',
    initialUsd: 500,
    name: 'MyVault',
};

const signTypedDatasMock = vi.fn().mockResolvedValue([
    '0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c',
] as `0x${string}`[]);

const functionOptions = {
    evm: {
        signTypedDatas: signTypedDatasMock,
    },
};

describe('createVault', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should create a vault successfully', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({ data: { withdrawable: 1000 } }) // clearinghouseState
            .mockResolvedValueOnce({ data: { status: 'ok' } })        // approveAgent
            .mockResolvedValueOnce({
                data: {
                    status: 'ok',
                    response: {
                        data: {
                            statuses: [{ filled: { totalSz: '1' } }],
                        },
                    },
                },
            }); // createVault

        const result = await createVault(defaultProps, functionOptions as any);

        expect(result.success).toBe(true);
        expect(result.data).toBe('Successfully created vault!');
    });

    it('should return error if required fields are missing or invalid', async () => {
        const badProps = {
            ...defaultProps,
            description: 'short',
            name: 'ab',
        };

        const result = await createVault(badProps, functionOptions as any);

        expect(result).toEqual(toResult('Provide name (min 3 characters) and description (min 10 characters)', true));
    });

    it('should return error if initialUsd is less than 100', async () => {
        const smallProps = {
            ...defaultProps,
            initialUsd: 10,
        };

        const result = await createVault(smallProps, functionOptions as any);

        expect(result).toEqual(toResult('Minimum vault size is 100$', true));
    });

    it('should return error if not enough withdrawable balance', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { withdrawable: 100 } });

        const props = {
            ...defaultProps,
            initialUsd: 200,
        };

        const result = await createVault(props, functionOptions as any);

        expect(result).toEqual(toResult('Not enough money', true));
    });

    it('should return error if signTypedDatas is unavailable', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { withdrawable: 1000 } });

        const result = await createVault(defaultProps, {
            evm: {},
        } as any);

        expect(result).toEqual(toResult('Failed to create vault on Hyperliquid. Please try again.', true));
    });

    it('should handle error when approveAgent API call fails', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({ data: { withdrawable: 1000 } })
            .mockRejectedValueOnce(new Error('Approve error'));

        const result = await createVault(defaultProps, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to create vault on Hyperliquid');
    });

    it('should handle error if createVault API returns err status', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({ data: { withdrawable: 1000 } })
            .mockResolvedValueOnce({ data: { status: 'ok' } }) // approveAgent
            .mockResolvedValueOnce({ data: { status: 'err', response: 'error' } });

        const result = await createVault(defaultProps, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to create vault on Hyperliquid');
    });

    it('should handle error if createVault response contains error messages', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({ data: { withdrawable: 1000 } })
            .mockResolvedValueOnce({ data: { status: 'ok' } }) // approveAgent
            .mockResolvedValueOnce({
                data: {
                    status: 'ok',
                    response: {
                        data: {
                            statuses: [{ error: 'rejected' }, {}],
                        },
                    },
                },
            });

        const result = await createVault(defaultProps, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to create vault on Hyperliquid');
    });
});
