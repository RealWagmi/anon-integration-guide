import { PublicClient } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import { checkBalance } from './checkBalance';

describe('checkBalance', () => {
    it('throws an error if the balance is insufficient', async () => {
        const provider = {
            getBalance: vi.fn().mockReturnValue(Promise.resolve(100n)),
        } as unknown as PublicClient;

        const args = {
            account: '0x1234567890123456789012345678901234567890',
            amount: 200n,
            decimals: 0,
        } as const;

        await expect(
            checkBalance({
                args,
                provider,
            }),
        ).rejects.toThrowError('Insufficient balance. User has 100 and wants to transfer 200.');

        expect(provider.getBalance).toHaveBeenCalledWith({ address: args.account });
    });

    it('does not throw an error if the balance is sufficient', async () => {
        const provider = {
            getBalance: vi.fn().mockReturnValue(Promise.resolve(200n)),
        } as unknown as PublicClient;

        const args = {
            account: '0x1234567890123456789012345678901234567890',
            amount: 200n,
            decimals: 0,
        } as const;

        await expect(
            checkBalance({
                args,
                provider,
            }),
        ).resolves.not.toThrow();

        expect(provider.getBalance).toHaveBeenCalledWith({ address: args.account });
    });
});
