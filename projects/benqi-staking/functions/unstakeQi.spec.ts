import { encodeFunctionData, parseUnits } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import veQiAbi from '../abis/veQi';
import { QI_DECIMALS, VE_QI_ADDRESS } from '../constants';
import { unstakeQi } from './unstakeQi';

vi.mock('@heyanon/sdk');

describe('unstakeQi', () => {
    it('should call withdraw of veQi contract', async () => {
        const props: Parameters<typeof unstakeQi>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            amount: '2.12',
        };

        const tools: Parameters<typeof unstakeQi>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn(),
        };

        const result = await unstakeQi(props, tools);

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: VE_QI_ADDRESS,
                        data: encodeFunctionData({
                            abi: veQiAbi,
                            functionName: 'withdraw',
                            args: [parseUnits(props.amount, QI_DECIMALS)],
                        }),
                    },
                ],
            }),
        );
        expect(result.data).toMatch(`Successfully unstaked ${props.amount} tokens`);
    });
});
