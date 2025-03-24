import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toggleDepositsEnabled } from '../toggleDepositsEnabled';
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
    _getUsersVaultAddress: vi.fn(async (_addr, name) => (name === 'Sifu' ? '0xf967239debef10dbc78e9bbbb2d8a16b72a614eb' : undefined)),
}));

const mockedAxios = (axios as unknown) as { post: ReturnType<typeof vi.fn> };

const mockSignTypedDatas = vi
    .fn()
    .mockResolvedValue(['0x9f8f577823132326a0b55dea300f5b2427f3affe5b9c11eeef1ebf969238038b56bf4176fd974312f8d074eb4a5250480c088897c416098decf89a0ceaaf7cc51c']);

const account = '0x5dd596c901987a2b28c38a9c1dfbf86fffc15d77' as const;

const defaultProps = {
    account,
    vault: 'Sifu',
    value: false,
};

const functionOptions = {
    evm: {
        signTypedDatas: mockSignTypedDatas,
    },
};

describe('toggleDepositsEnabled', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully toggle deposit setting', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({ data: { allowDeposits: true } }) // vaultDetails
            .mockResolvedValueOnce({ data: { status: 'ok' } }) // approveAgent
            .mockResolvedValueOnce({
                data: {
                    status: 'ok',
                    response: { data: { statuses: [{}] } },
                },
            }); // vaultModify

        const result = await toggleDepositsEnabled(defaultProps, functionOptions as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('Successfully updated vault');
    });

    it('should return early if value is already set', async () => {
        mockedAxios.post.mockResolvedValueOnce({ data: { allowDeposits: false } });

        const result = await toggleDepositsEnabled(defaultProps, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('It is already that way');
    });

    it('should resolve vault name to address', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({ data: { allowDeposits: true } })
            .mockResolvedValueOnce({ data: { status: 'ok' } })
            .mockResolvedValueOnce({
                data: {
                    status: 'ok',
                    response: { data: { statuses: [{}] } },
                },
            });

        const result = await toggleDepositsEnabled({ ...defaultProps, vault: 'Sifu' }, functionOptions as any);

        expect(result.success).toBe(true);
    });

    it('should return error if vault name is invalid', async () => {
        const result = await toggleDepositsEnabled({ ...defaultProps, vault: 'InvalidName' }, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Invalid vault specified');
    });

    it('should return error if signTypedDatas is missing', async () => {
        const result = await toggleDepositsEnabled(defaultProps, {
            evm: {},
        } as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to update vault on Hyperliquid');
    });

    it('should handle vaultModify response with status "err"', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({ data: { allowDeposits: true } })
            .mockResolvedValueOnce({ data: { status: 'ok' } })
            .mockResolvedValueOnce({ data: { status: 'err', response: 'boom' } });

        const result = await toggleDepositsEnabled(defaultProps, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to update vault on Hyperliquid');
    });

    it('should handle response with error in statuses', async () => {
        mockedAxios.post
            .mockResolvedValueOnce({ data: { allowDeposits: true } })
            .mockResolvedValueOnce({ data: { status: 'ok' } })
            .mockResolvedValueOnce({
                data: {
                    status: 'ok',
                    response: {
                        data: {
                            statuses: [{ error: 'Order rejected' }, {}],
                        },
                    },
                },
            });

        const result = await toggleDepositsEnabled(defaultProps, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to update vault on Hyperliquid');
    });

    it('should catch and log unexpected errors', async () => {
        mockedAxios.post.mockRejectedValueOnce(new Error('Network fail'));

        const consoleSpy = vi.spyOn(console, 'log');

        const result = await toggleDepositsEnabled(defaultProps, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to update vault on Hyperliquid');
        expect(consoleSpy).toHaveBeenCalled();
    });
});
