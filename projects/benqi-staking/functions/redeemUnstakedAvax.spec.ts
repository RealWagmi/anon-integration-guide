import { encodeFunctionData } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import sAvaxAbi from '../abis/sAvax';
import { SAVAX_ADDRESS } from '../constants';
import { redeemUnstakedAvax } from './redeemUnstakedAvax';

vi.mock('@heyanon/sdk');

describe('redeemUnstakedAvax', () => {
    it('should call redeem of sAvax contract', async () => {
        const props: Parameters<typeof redeemUnstakedAvax>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
        };

        const tools: Parameters<typeof redeemUnstakedAvax>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn(),
        };

        const result = await redeemUnstakedAvax(props, tools);

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: SAVAX_ADDRESS,
                        data: encodeFunctionData({
                            abi: sAvaxAbi,
                            functionName: 'redeem',
                            args: [],
                        }),
                    },
                ],
            }),
        );
        expect(result.data).toMatch('Successfully redeemed unstaked AVAX');
    });
});
