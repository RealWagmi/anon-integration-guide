import { describe, it, expect, vi, beforeEach } from 'vitest';
import { closeVault } from '../closeVault';
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

vi.mock('../utils/_getUsersVaultAddress', () => ({
    _getUsersVaultAddress: vi.fn(async () => '0xf967239debef10dbc78e9bbbb2d8a16b72a614eb'),
}));

import axios from 'axios';
const mockedAxios = axios as unknown as { post: ReturnType<typeof vi.fn> };

const defaultProps = {
    account: '0x92CC36D66e9d739D50673d1f27929a371FB83a67' as Address,
    vault: '0xf967239debef10dbc78e9bbbb2d8a16b72a614eb',
};

const signTypedDatasMock = vi.fn().mockResolvedValue([
    '0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c',
] as `0x${string}`[]);

const functionOptions = {
    evm: {
        signTypedDatas: signTypedDatasMock,
    },
};

describe('closeVault', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should close a vault successfully', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({ data: { assetPositions: [] } }) // clearinghouseState
            .mockResolvedValueOnce({ data: { status: 'ok' } })       // approveAgent
            .mockResolvedValueOnce({
                data: {
                    status: 'ok',
                    response: {
                        data: {
                            statuses: [{ filled: { totalSz: '1' } }],
                        },
                    },
                },
            }); // vaultDistribute

        const result = await closeVault(defaultProps, functionOptions as any);

        expect(result.success).toBe(true);
        expect(result.data).toBe('Successfully closed vault!');
    });

    it('should resolve vault address if not valid address', async () => {
        const { _getUsersVaultAddress } = await import('../utils/_getUsersVaultAddress');
        (_getUsersVaultAddress as any).mockResolvedValue('0xf967239debef10dbc78e9bbbb2d8a16b72a614eb');

        mockedAxios.post
            .mockResolvedValueOnce({ data: { assetPositions: [] } })
            .mockResolvedValueOnce({ data: { status: 'ok' } })
            .mockResolvedValueOnce({ data: { status: 'ok', response: { data: { statuses: [{}] } } } });

        const result = await closeVault({ ...defaultProps, vault: 'MyVault' }, functionOptions as any);

        expect(result.success).toBe(true);
        expect(_getUsersVaultAddress).toHaveBeenCalled();
    });

    it('should return error if vault resolution fails', async () => {
        const { _getUsersVaultAddress } = await import('../utils/_getUsersVaultAddress');
        (_getUsersVaultAddress as any).mockResolvedValueOnce(null);

        const result = await closeVault({ ...defaultProps, vault: 'nonexistentVault' }, functionOptions as any);

        expect(result).toEqual(toResult('Invalid vault specified', true));
    });

    it('should return error if vault has open positions', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                assetPositions: [{ coin: 'ETH' }],
            },
        });

        const result = await closeVault(defaultProps, functionOptions as any);

        expect(result).toEqual(toResult(`Close vault's positions before closing it`, true));
    });

    it('should return error if signTypedDatas is unavailable', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { assetPositions: [] } });

        const result = await closeVault(defaultProps, {
            evm: {},
        } as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to close vault on Hyperliquid');
    });

    it('should return error if approveAgent request fails', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({ data: { assetPositions: [] } })
            .mockRejectedValueOnce(new Error('approveAgent error'));

        const result = await closeVault(defaultProps, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to close vault on Hyperliquid');
    });

    it('should return error if vaultDistribute status is "err"', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({ data: { assetPositions: [] } })
            .mockResolvedValueOnce({ data: { status: 'ok' } })
            .mockResolvedValueOnce({ data: { status: 'err', response: 'some error' } });

        const result = await closeVault(defaultProps, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to close vault on Hyperliquid');
    });

    it('should return error if vaultDistribute response contains error in statuses', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({ data: { assetPositions: [] } })
            .mockResolvedValueOnce({ data: { status: 'ok' } })
            .mockResolvedValueOnce({
                data: {
                    status: 'ok',
                    response: {
                        data: {
                            statuses: [{ error: 'Vault rejected' }],
                        },
                    },
                },
            });

        const result = await closeVault(defaultProps, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to close vault on Hyperliquid');
    });
});
