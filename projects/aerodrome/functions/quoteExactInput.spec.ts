import { formatUnits, parseUnits } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import { quoteExactInput } from './quoteExactInput';
import { encodePath } from "../utils/path";
import { parseAmount } from "../utils/parse";

vi.mock('@heyanon/sdk');

describe('quoteExactInput', () => {
    it('should simulate swap outcome', async () => {
        const amountIn = '1';
        const amountOut = parseUnits('1', 18);
        const props: Parameters<typeof quoteExactInput>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Base',
            tokens: ['0x4200000000000000000000000000000000000006', '0x940181a94a35a4569e4529a3cdfb74e38fd98631'],
            fees: ['V3_LOW'],
            amountIn: amountIn,
        };

        const token0Decimals = {status: 'success', result: 18};
        const token1Decimals = {status: 'success', result: 18};
        const token1Symbol = {status: 'success', result: 'AERO'};

        const provider = {
            multicall: vi.fn().mockReturnValue(Promise.resolve([token0Decimals, token1Decimals, token1Symbol])),
            simulateContract: vi.fn().mockReturnValue({result: [amountOut, [], [], 0]}),
        };

        const tools: Parameters<typeof quoteExactInput>[1] = {
            sendTransactions: vi.fn(),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await quoteExactInput(props, tools);
        const amount = parseAmount({
            amount: props.amountIn,
            decimals: 18,
        });
        if (!amount.success) throw new Error(`amount parsing error: ${amount.errorMessage}`);

        expect(result.data).toMatch(
            `After swap with provided tokens and fees you would receive: ${formatUnits(amountOut, 18)} AERO`
        );
    });
});
