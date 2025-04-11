import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import * as utils from '../utils/_getUsersVaultAddress';
import { increasePerpPositionByMultiplying } from '../increasePerpPositionByMultiplying';
import { openPerp } from '../openPerp';
import { FunctionOptions } from '@heyanon/sdk';

vi.mock('axios');
vi.mock('../utils/_getUsersVaultAddress');
vi.mock('../openPerp');

const mockedAxios = (axios as unknown) as { post: ReturnType<typeof vi.fn> };
const mockedOpenPerp = (openPerp as unknown) as ReturnType<typeof vi.fn>;
const mockedGetVaultAddress = utils._getUsersVaultAddress as ReturnType<typeof vi.fn>;

const defaultProps = {
    account: '0xUserWithVaultAddress' as const,
    asset: 'eth',
    sizeMultiplier: '2',
};

// @ts-ignore
const functionOptions: FunctionOptions = {
    evm: {} as any,
    notify: vi.fn(),
};

describe('increasePerpPositionByMultiplying', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should increase position successfully', async () => {
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

        mockedOpenPerp.mockResolvedValueOnce({ success: true, data: 'Modified' });

        const result = await increasePerpPositionByMultiplying(defaultProps, functionOptions);
        expect(result.success).toBe(true);
        expect(result.data).toContain('Successfully modified');
        expect(mockedOpenPerp).toHaveBeenCalled();
    });

    it('should resolve vault name to address and increase position', async () => {
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

        const result = await increasePerpPositionByMultiplying({ ...defaultProps, vault: 'test-vault' }, functionOptions);

        expect(mockedGetVaultAddress).toHaveBeenCalled();
        expect(result.success).toBe(true);
    });

    it('should return error if vault resolution fails', async () => {
        mockedGetVaultAddress.mockResolvedValue(null);

        const result = await increasePerpPositionByMultiplying({ ...defaultProps, vault: 'bad-vault' }, functionOptions);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Invalid vault');
    });

    it('should return error if user has no perp in that asset', async () => {
        mockedAxios.post = vi.fn().mockResolvedValueOnce({
            data: {
                assetPositions: [
                    {
                        position: {
                            coin: 'btc',
                            szi: 1,
                            leverage: { value: 10 },
                        },
                    },
                ],
            },
        });

        const result = await increasePerpPositionByMultiplying(defaultProps, functionOptions);
        expect(result.success).toBe(false);
        expect(result.data).toContain("don't have a perp");
    });

    it('should return error if sizeMultiplier <= 1', async () => {
        const result = await increasePerpPositionByMultiplying({ ...defaultProps, sizeMultiplier: '1' }, functionOptions);

        expect(result.success).toBe(false);
        expect(result.data).toContain('needs to be larger');
    });

    it('should return error if openPerp fails', async () => {
        mockedAxios.post = vi.fn().mockResolvedValueOnce({
            data: {
                assetPositions: [
                    {
                        position: {
                            coin: 'eth',
                            szi: 1,
                            leverage: { value: 10 },
                        },
                    },
                ],
            },
        });

        mockedOpenPerp.mockResolvedValueOnce({ success: false });

        const result = await increasePerpPositionByMultiplying(defaultProps, functionOptions);
        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to modify');
    });

    it('should handle exception gracefully', async () => {
        mockedAxios.post = vi.fn().mockRejectedValueOnce(new Error('Network error'));

        const result = await increasePerpPositionByMultiplying(defaultProps, functionOptions);
        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to modify');
    });
});
