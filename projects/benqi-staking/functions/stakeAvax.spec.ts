import { encodeFunctionData, parseUnits } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import sAvaxAbi from '../abis/sAvax';
import { AVAX_DECIMALS, SAVAX_ADDRESS } from '../constants';
import { stakeAvax } from './stakeAvax';

vi.mock('@heyanon/sdk');

describe('stakeAvax', () => {
    it('should call submit of sAvax contract', async () => {
        const props: Parameters<typeof stakeAvax>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            amount: '2.12',
        };

        const provider = {
            getBalance: vi.fn().mockReturnValueOnce(Promise.resolve(parseUnits(props.amount, AVAX_DECIMALS))),
        };

        const tools: Parameters<typeof stakeAvax>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await stakeAvax(props, tools);

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: SAVAX_ADDRESS,
                        data: encodeFunctionData({
                            abi: sAvaxAbi,
                            functionName: 'submit',
                            args: [],
                        }),
                        value: parseUnits(props.amount, AVAX_DECIMALS),
                    },
                ],
            }),
        );
        expect(result.data).toMatch(`Successfully staked ${props.amount} tokens`);
    });
});
