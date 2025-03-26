import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withdrawFromVault } from '../withdrawFromVault';
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

vi.mock('../utils/_getVaultAddress', () => ({
    _getVaultAddress: vi.fn(async name => (name === 'Sifu' ? '0xf967239debef10dbc78e9bbbb2d8a16b72a614eb' : undefined)),
}));

const mockedAxios = (axios as unknown) as { post: ReturnType<typeof vi.fn> };

const mockSignTypedDatas = vi
    .fn()
    .mockResolvedValue(['0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c']);

const account = '0x5dd596c901987a2b28c38a9c1dfbf86fffc15d77' as const;

const defaultProps = {
    account,
    vault: 'Sifu',
    usd: 100,
};

const functionOptions = {
    evm: {
        signTypedDatas: mockSignTypedDatas,
    },
};

describe('withdrawFromVault', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully withdraw from vault', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({ data: { maxWithdrawable: 1000 } }) // vaultDetails
            .mockResolvedValueOnce({ data: { status: 'ok' } }) // approveAgent
            .mockResolvedValueOnce({
                data: {
                    status: 'ok',
                    response: { data: { statuses: [{}] } },
                },
            }); // vaultTransfer

        const result = await withdrawFromVault(defaultProps, functionOptions as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('Successfully withdrew from vault');
    });

    it('should return error if vault name is invalid', async () => {
        const result = await withdrawFromVault({ ...defaultProps, vault: 'InvalidName' }, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Invalid vault specified');
    });

    it('should return error if USD is too low', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { maxWithdrawable: 1000 } });

        const result = await withdrawFromVault({ ...defaultProps, usd: 5 }, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Minimum deposit value is 10$');
    });

    it('should return error if USD is too high', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { maxWithdrawable: 50 } });

        const result = await withdrawFromVault({ ...defaultProps, usd: 100 }, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Your withdrawable balance in vault is 50$');
    });

    it('should return specific error if withdrawal is during lockup', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({ data: { maxWithdrawable: 1000 } })
            .mockResolvedValueOnce({ data: { status: 'ok' } })
            .mockResolvedValueOnce({
                data: {
                    status: 'err',
                    response: 'Cannot withdraw during lockup period after depositing.',
                },
            });

        const result = await withdrawFromVault(defaultProps, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Cannot withdraw during lockup');
    });

    it('should catch and log unexpected errors', async () => {
        mockedAxios.post.mockRejectedValueOnce(new Error('Something bad'));

        const consoleSpy = vi.spyOn(console, 'log');

        const result = await withdrawFromVault(defaultProps, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to withdraw from vault on Hyperliquid');
        expect(consoleSpy).toHaveBeenCalled();
    });

    it('should return error if signTypedDatas is missing', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { maxWithdrawable: 1000 } });

        const result = await withdrawFromVault(defaultProps, {
            evm: {},
        } as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to withdraw from vault on Hyperliquid');
    });

    it('should handle vaultTransfer response with error in statuses', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({ data: { maxWithdrawable: 1000 } })
            .mockResolvedValueOnce({ data: { status: 'ok' } })
            .mockResolvedValueOnce({
                data: {
                    status: 'ok',
                    response: {
                        data: {
                            statuses: [{ error: 'Transfer failed' }],
                        },
                    },
                },
            });

        const result = await withdrawFromVault(defaultProps, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to withdraw from vault on Hyperliquid');
    });
});
