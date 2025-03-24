import { describe, expect, it, vi, beforeEach } from 'vitest';
import { modifyPerpPositionByUSD } from '../modifyPerpPositionByUSD';
import { _getUsersVaultAddress } from '../utils/_getUsersVaultAddress';
import { openPerp } from '../openPerp';
import axios from 'axios';
import { Address } from 'viem';

vi.mock('../utils/_getUsersVaultAddress');
vi.mock('../openPerp');
vi.mock('axios');

const mockedAxios = (axios as unknown) as { post: any };
const mockedGetVaultAddress = (_getUsersVaultAddress as unknown) as ReturnType<typeof vi.fn>;
const mockedOpenPerp = (openPerp as unknown) as ReturnType<typeof vi.fn>;

const defaultProps = {
    account: '0xUser' as Address,
    asset: 'eth',
    size: '1',
    vault: undefined
};

const functionOptions = {
    notify: vi.fn(),
};

describe('modifyPerpPositionByUSD', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should modify position successfully', async () => {
        mockedAxios.post = vi.fn().mockResolvedValueOnce({
            data: {
                assetPositions: [
                    {
                        position: {
                            coin: 'eth',
                            szi: 1,
                            leverage: {
                                value: 10,
                            },
                        },
                    },
                ],
            },
        });

        mockedOpenPerp.mockResolvedValueOnce({ success: true });

        const result = await modifyPerpPositionByUSD(defaultProps, functionOptions as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('Successfully modified position.');
    });

    it('should resolve vault name to address', async () => {
        mockedGetVaultAddress.mockResolvedValue('0xResolvedVault');
        mockedAxios.post = vi.fn().mockResolvedValueOnce({
            data: {
                assetPositions: [
                    {
                        position: {
                            coin: 'eth',
                            szi: 1,
                            leverage: {
                                value: 10,
                            },
                        },
                    },
                ],
            },
        });

        mockedOpenPerp.mockResolvedValueOnce({ success: true });

        const result = await modifyPerpPositionByUSD({ ...defaultProps, vault: 'vault-name' }, functionOptions as any);

        expect(mockedGetVaultAddress).toHaveBeenCalled();
        expect(result.success).toBe(true);
    });

    it('should return error if vault resolution fails', async () => {
        mockedGetVaultAddress.mockResolvedValue(null);

        const result = await modifyPerpPositionByUSD({ ...defaultProps, vault: 'vault-name' }, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Invalid vault specified');
    });

    it("should return error if user doesn't have a perp in asset", async () => {
        mockedAxios.post = vi.fn().mockResolvedValueOnce({
            data: {
                assetPositions: [],
            },
        });

        const result = await modifyPerpPositionByUSD(defaultProps, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain("You don't have a perp in that asset.");
    });

    it('should return error if openPerp fails', async () => {
        mockedAxios.post = vi.fn().mockResolvedValueOnce({
            data: {
                assetPositions: [
                    {
                        position: {
                            coin: 'eth',
                            szi: 1,
                            leverage: {
                                value: 10,
                            },
                        },
                    },
                ],
            },
        });

        mockedOpenPerp.mockResolvedValueOnce({ success: false });

        const result = await modifyPerpPositionByUSD(defaultProps, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to modify position on Hyperliquid.');
    });

    it('should handle exception gracefully', async () => {
        mockedAxios.post = vi.fn().mockRejectedValueOnce(new Error('Network error'));

        const result = await modifyPerpPositionByUSD(defaultProps, functionOptions as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to modify position on Hyperliquid');
    });
});
