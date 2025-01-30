import { encodeFunctionData, parseUnits } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import sAvaxAbi from '../abis/sAvax';
import { AVAX_DECIMALS, SAVAX_ADDRESS } from '../constants';
import { unstakeAvax } from './unstakeAvax';

vi.mock('@heyanon/sdk');

describe('unstakeAvax', () => {
    it('should call requestUnlock of sAvax contract', async () => {
        const props: Parameters<typeof unstakeAvax>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            amount: '2.12',
        };

        const tools: Parameters<typeof unstakeAvax>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn(),
        };

        const result = await unstakeAvax(props, tools);

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: SAVAX_ADDRESS,
                        data: encodeFunctionData({
                            abi: sAvaxAbi,
                            functionName: 'requestUnlock',
                            args: [parseUnits(props.amount, AVAX_DECIMALS)],
                        }),
                    },
                ],
            }),
        );
        expect(result.data).toMatch(`Successfully requested unstake for ${props.amount} tokens`);
    });
});
