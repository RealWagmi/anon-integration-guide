import { describe, it, expect, vi, beforeEach } from 'vitest';
import { decreasePerpPositionByMultiplying } from '../decreasePerpPositionByMultiplying';
import { toResult } from '@heyanon/sdk';
import { Address } from 'viem';

vi.mock('axios', () => ({
    default: {
        post: vi.fn(),
    },
}));

vi.mock('../openPerp', () => ({
    openPerp: vi.fn(),
}));

vi.mock('../utils/_getUsersVaultAddress', () => ({
    _getUsersVaultAddress: vi.fn(async () => '0xVaultAddressResolved'),
}));

import axios from 'axios';
import { openPerp } from '../openPerp';
import { _getUsersVaultAddress } from '../utils/_getUsersVaultAddress';

const mockedAxios = (axios as unknown) as { post: ReturnType<typeof vi.fn> };
const mockedOpenPerp = (openPerp as unknown) as ReturnType<typeof vi.fn>;

const defaultProps = {
    account: '0x1234567890123456789012345678901234567890' as Address,
    asset: 'ETH',
    sizeMultiplier: '0.5',
};

const functionOptions = {
    notify: vi.fn(),
};

describe('decreasePerpPositionByMultiplying', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should decrease the position successfully', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                assetPositions: [
                    {
                        position: {
                            coin: 'ETH',
                            szi: '2',
                            leverage: { value: 10 },
                        },
                    },
                ],
            },
        });

        mockedOpenPerp.mockResolvedValueOnce(toResult('Successfully modified position.'));

        const result = await decreasePerpPositionByMultiplying(defaultProps, functionOptions as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('Successfully modified position');
        expect(mockedOpenPerp).toHaveBeenCalledWith(
            expect.objectContaining({
                size: '1',
                short: true,
                updating: true,
                sizeUnit: 'ASSET',
            }),
            functionOptions,
        );
    });

    it('should resolve vault address if vault is name', async () => {
        (_getUsersVaultAddress as any).mockResolvedValueOnce('0xResolvedVaultAddress');

        mockedAxios.post.mockResolvedValueOnce({
            data: {
                assetPositions: [
                    {
                        position: {
                            coin: 'ETH',
                            szi: '4',
                            leverage: { value: 3 },
                        },
                    },
                ],
            },
        });

        mockedOpenPerp.mockResolvedValueOnce(toResult('Successfully modified position.'));

        const result = await decreasePerpPositionByMultiplying({ ...defaultProps, vault: 'MyVaultName' }, functionOptions as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('Successfully modified position');
        expect(_getUsersVaultAddress).toHaveBeenCalled();
    });

    it('should return error if vault resolution fails', async () => {
        (_getUsersVaultAddress as any).mockResolvedValueOnce(null);

        const result = await decreasePerpPositionByMultiplying({ ...defaultProps, vault: 'InvalidVaultName' }, functionOptions as any);

        expect(result).toEqual(toResult('Invalid vault specified', true));
    });

    it('should return error if user has no position in that asset', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                assetPositions: [
                    {
                        position: {
                            coin: 'BTC',
                            szi: '2',
                            leverage: { value: 5 },
                        },
                    },
                ],
            },
        });

        const result = await decreasePerpPositionByMultiplying(defaultProps, functionOptions as any);

        expect(result).toEqual(toResult("You don't have a perp in that asset.", true));
    });

    it('should return error if sizeMultiplier >= 1', async () => {
        const result = await decreasePerpPositionByMultiplying({ ...defaultProps, sizeMultiplier: '1' }, functionOptions as any);

        expect(result).toEqual(toResult('Position needs to be smaller when you decrease it.', true));
    });

    it('should return error if openPerp fails', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: {
                assetPositions: [
                    {
                        position: {
                            coin: 'ETH',
                            szi: '2',
                            leverage: { value: 10 },
                        },
                    },
                ],
            },
        });

        mockedOpenPerp.mockResolvedValueOnce(toResult('Failed to modify position on Hyperliquid. ', true));

        const result = await decreasePerpPositionByMultiplying(defaultProps, functionOptions as any);

        expect(result).toEqual(toResult('Failed to modify position on Hyperliquid. ', true));
    });

    it('should handle exception gracefully', async () => {
        mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

        const result = await decreasePerpPositionByMultiplying(defaultProps, functionOptions as any);

        expect(result).toEqual(toResult('Failed to modify position on Hyperliquid. Please try again.', true));
    });
});
