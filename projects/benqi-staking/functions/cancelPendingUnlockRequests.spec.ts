import { encodeFunctionData } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import sAvaxAbi from '../abis/sAvax';
import { SAVAX_ADDRESS } from '../constants';
import { cancelPendingUnlockRequests } from './cancelPendingUnlockRequests';

vi.mock('@heyanon/sdk');

describe('cancelPendingUnlockRequests', () => {
    it('should call cancelPendingUnlockRequests of sAvax contract', async () => {
        const props: Parameters<typeof cancelPendingUnlockRequests>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
        };

        const tools: Parameters<typeof cancelPendingUnlockRequests>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: true })),
            notify: vi.fn(),
            getProvider: vi.fn(),
        };

        await cancelPendingUnlockRequests(props, tools);

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: SAVAX_ADDRESS,
                        data: encodeFunctionData({
                            abi: sAvaxAbi,
                            functionName: 'cancelPendingUnlockRequests',
                            args: [],
                        }),
                    },
                ],
            }),
        );
    });
});
