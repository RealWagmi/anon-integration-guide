import { PublicClient } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import { checkERC20Balance } from './checkERC20Balance';

describe('checkERC20Balance', () => {
    it('throws an error if the balance is insufficient', async () => {
        const provider = {
            readContract: vi.fn().mockReturnValue(Promise.resolve(100n)),
        } as unknown as PublicClient;

        const args = {
            account: '0x1234567890123456789012345678901234567890',
            amount: 200n,
            decimals: 0,
            token: '0x1234567890123456789012345678901234567891',
        } as const;

        await expect(
            checkERC20Balance({
                args,
                provider,
            }),
        ).rejects.toThrowError('Insufficient balance. User has 100 and wants to transfer 200.');

        expect(provider.readContract).toHaveBeenCalledWith(
            expect.objectContaining({
                address: args.token,
                functionName: 'balanceOf',
                args: [args.account],
            }),
        );
    });

    it('does not throw an error if the balance is sufficient', async () => {
        const provider = {
            readContract: vi.fn().mockReturnValue(Promise.resolve(200n)),
        } as unknown as PublicClient;

        const args = {
            account: '0x1234567890123456789012345678901234567890',
            amount: 200n,
            decimals: 0,
            token: '0x1234567890123456789012345678901234567891',
        } as const;

        await expect(
            checkERC20Balance({
                args,
                provider,
            }),
        ).resolves.not.toThrow();

        expect(provider.readContract).toHaveBeenCalledWith(
            expect.objectContaining({
                address: args.token,
                functionName: 'balanceOf',
                args: [args.account],
            }),
        );
    });
});
