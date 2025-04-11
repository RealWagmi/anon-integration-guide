import { describe, it, expect, vi, beforeEach } from 'vitest';
import { removeMargin } from '../removeMargin';
import axios from 'axios';

vi.mock('axios', () => ({
    default: {
        post: vi.fn(),
    },
}));

vi.mock('viem/accounts', () => ({
    generatePrivateKey: vi.fn(() => 'dummy-private-key'),
    privateKeyToAccount: vi.fn(() => ({
        address: '0xAgentWalletAddress',
        signTypedData: vi.fn(),
    })),
}));

vi.mock('../utils/_signL1Action', () => ({
    _signL1Action: vi.fn(() => 'dummy-l1-signature'),
}));

vi.mock('../utils/_getUsersVaultAddress', () => ({
    _getUsersVaultAddress: vi.fn(async (_account, vaultName) => (vaultName === 'Sifu' ? '0xf967239debef10dbc78e9bbbb2d8a16b72a614eb' : undefined)),
}));

const mockedAxios = (axios as unknown) as { post: ReturnType<typeof vi.fn> };

const mockSignTypedDatas = vi
    .fn()
    .mockResolvedValue(['0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c']);

const defaultProps = {
    account: '0x5dd596c901987a2b28c38a9c1dfbf86fffc15d77' as const,
    asset: 'ETH',
    amount: '50',
};

const functionOptions = {
    notify: vi.fn().mockResolvedValue(undefined),
    evm: {
        signTypedDatas: mockSignTypedDatas,
    },
};

describe('removeMargin', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully remove margin from perp', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({
                data: {
                    assetPositions: [
                        {
                            position: {
                                coin: 'ETH',
                                szi: '2',
                                leverage: { value: '5' },
                            },
                        },
                    ],
                    withdrawable: 100,
                },
            }) // clearinghouseState
            .mockResolvedValueOnce({ data: { status: 'ok' } }) // approveAgent
            .mockResolvedValueOnce({
                data: {
                    status: 'ok',
                    response: { data: { statuses: [{}] } },
                },
            }); // updateIsolatedMargin

        const result = await removeMargin(defaultProps, functionOptions as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('Successfully removed margin');
    });

    it('should return error if vault name is invalid', async () => {
        const result = await removeMargin({ ...defaultProps, vault: 'InvalidVault' }, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Invalid vault specified');
    });

    it('should return error if user does not have the perp in asset', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                assetPositions: [
                    {
                        position: {
                            coin: 'BTC',
                            szi: '1.5',
                            leverage: { value: '10' },
                        },
                    },
                ],
                withdrawable: 100,
            },
        });

        const result = await removeMargin(defaultProps, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain("You don't have a perp in that asset.");
    });

    it('should return error if signTypedDatas is missing', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                assetPositions: [
                    {
                        position: {
                            coin: 'ETH',
                            szi: '1.5',
                            leverage: { value: '10' },
                        },
                    },
                ],
                withdrawable: 100,
            },
        });

        const result = await removeMargin(defaultProps, {
            notify: functionOptions.notify,
            evm: {},
        } as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to modify position on Hyperliquid');
    });

    it('should return error if updateIsolatedMargin response is "err"', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({
                data: {
                    assetPositions: [
                        {
                            position: {
                                coin: 'ETH',
                                szi: '1.5',
                                leverage: { value: '10' },
                            },
                        },
                    ],
                    withdrawable: 100,
                },
            })
            .mockResolvedValueOnce({ data: { status: 'ok' } }) // approveAgent
            .mockResolvedValueOnce({ data: { status: 'err', response: 'Something went wrong' } }); // error

        const result = await removeMargin(defaultProps, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to modify position on Hyperliquid');
    });

    it('should return error if response contains error message in statuses', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({
                data: {
                    assetPositions: [
                        {
                            position: {
                                coin: 'ETH',
                                szi: '1.5',
                                leverage: { value: '10' },
                            },
                        },
                    ],
                    withdrawable: 100,
                },
            })
            .mockResolvedValueOnce({ data: { status: 'ok' } })
            .mockResolvedValueOnce({
                data: {
                    status: 'ok',
                    response: {
                        data: {
                            statuses: [{ error: 'Update failed' }],
                        },
                    },
                },
            });

        const result = await removeMargin(defaultProps, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to modify position on Hyperliquid');
    });

    it('should catch and notify unexpected errors', async () => {
        const notifyMock = vi.fn().mockResolvedValue(undefined);
        mockedAxios.post.mockRejectedValueOnce(new Error('Some internal failure'));

        const result = await removeMargin(defaultProps, {
            // @ts-ignore
            evm: {
                signTypedDatas: mockSignTypedDatas,
            },
            notify: notifyMock,
        });

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to modify position on Hyperliquid');
        expect(notifyMock).toHaveBeenCalledWith('Some internal failure');
    });
});
