// src/functions/test/getUsersVaults.test.ts
import { describe, it, expect, vi } from 'vitest';
import { getUsersVaults } from '../getUsersVaults';
import * as allVaultUtils from '../utils/_getAllVaults';
import { toResult } from '@heyanon/sdk';

const vaultOwner = '0xvaultOwnerWithVaults';
const noVaultUser = '0xuserWithNoVaults';

const mockVaults = [
    {
        leader: vaultOwner,
        name: 'AlphaVault',
        tvl: 1000,
        createTimeMillis: new Date('2023-01-01').getTime(),
        vaultAddress: '0xvaultAlpha',
    },
    {
        leader: vaultOwner,
        name: 'BetaVault',
        tvl: 2000,
        createTimeMillis: new Date('2024-01-01').getTime(),
        vaultAddress: '0xvaultBeta',
    },
    {
        leader: '0xanotherUser',
        name: 'GammaVault',
        tvl: 1500,
        createTimeMillis: new Date('2022-01-01').getTime(),
        vaultAddress: '0xvaultGamma',
    },
];

describe('getUsersVaults', () => {
    it("should return the user's vaults sorted by creation date descending", async () => {
        vi.spyOn(allVaultUtils, '_getAllVaults').mockResolvedValue(mockVaults);

        const result = await getUsersVaults({ account: vaultOwner }, {} as any);

        expect(result.success).toBe(true);
        expect(result.data).toContain('Here is the list of all the vaults you are leading');
        expect(result.data).toContain('BetaVault');
        expect(result.data).toContain('AlphaVault');
        expect(result.data.indexOf('BetaVault')).toBeLessThan(result.data.indexOf('AlphaVault')); // newer one first
    });

    it('should return message if user has no vaults', async () => {
        vi.spyOn(allVaultUtils, '_getAllVaults').mockResolvedValue(mockVaults);

        const result = await getUsersVaults({ account: noVaultUser }, {} as any);

        expect(result).toEqual(toResult("You don't have any vaults"));
    });

    it('should handle error during fetch', async () => {
        vi.spyOn(allVaultUtils, '_getAllVaults').mockRejectedValue(new Error('Network error'));

        const result = await getUsersVaults({ account: vaultOwner }, {} as any);

        expect(result.success).toBe(false);
        expect(result.data).toContain('Failed to fetch vaults: Network error');
    });
});
