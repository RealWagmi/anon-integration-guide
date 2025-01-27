import { checkToApprove } from '@heyanon/sdk';
import { encodeFunctionData, parseUnits } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import veQiAbi from '../abis/veQi';
import { QI_ADDRESS, QI_DECIMALS, VE_QI_ADDRESS } from '../constants';
import { stakeQi } from './stakeQi';

vi.mock('@heyanon/sdk');

describe('stakeQi', () => {
    it('should setup allowance before transaction and call deposit method', async () => {
        const props: Parameters<typeof stakeQi>[0] = {
            account: '0x0000000000000000000000000000000000000000',
            chainName: 'Avalanche',
            amount: '2.12',
        };

        const tools: Parameters<typeof stakeQi>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn(),
        };

        const result = await stakeQi(props, tools);

        expect(checkToApprove).toHaveBeenCalledWith(
            expect.objectContaining({
                args: {
                    account: props.account,
                    target: QI_ADDRESS,
                    spender: VE_QI_ADDRESS,
                    amount: parseUnits(props.amount, QI_DECIMALS),
                },
            }),
        );

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: VE_QI_ADDRESS,
                        data: encodeFunctionData({
                            abi: veQiAbi,
                            functionName: 'deposit',
                            args: [parseUnits(props.amount, QI_DECIMALS)],
                        }),
                    },
                ],
            }),
        );
        expect(result.data).toMatch(`Successfully staked ${props.amount} tokens`);
    });
});
