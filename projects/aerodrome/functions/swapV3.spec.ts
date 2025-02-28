import { encodeFunctionData, Hex, parseUnits } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import universalRouter from '../abis/universalRouter';
import { CommandCode, UNIVERSAL_ROUTER_ADDRESS, V3SwapExactIn } from "../constants";
import { encodePath } from "../utils/path";
import { encodeV3SwapExactIn } from "../utils/encode";
import { swapV3 } from "./swapV3";

vi.mock('@heyanon/sdk');

describe('swapV3', () => {
    it('should swap wETH for AERO using V3', async () => {
        const props: Parameters<typeof swapV3>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Base',
            amountIn: '1',
            amountOutMin: '3500',
            tokens: [
                '0x4200000000000000000000000000000000000006',
                '0x940181a94a35a4569e4529a3cdfb74e38fd98631'
            ],
            fees: ['V3_LOW'],
        };
        const swapObj: V3SwapExactIn = {
            commandCode: CommandCode.V3_SWAP_EXACT_IN,
            recipient: props.account,
            amountIn: parseUnits('1', 18),
            amountOutMin: parseUnits('3500', 18),
            path: encodePath([
                '0x4200000000000000000000000000000000000006',
                '0x940181a94a35a4569e4529a3cdfb74e38fd98631'
            ], ['V3_LOW']),
            payerIsUser: true
        }

        const token0Decimals = {status: 'success', result: 18};
        const token1Decimals = {status: 'success', result: 18};

        const provider = {
            readContract: vi.fn(),
            multicall: vi.fn().mockReturnValue(Promise.resolve([token0Decimals, token1Decimals])),
        };

        const tools: Parameters<typeof swapV3>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await swapV3(props, tools);

        // build command and input bytecode
        let commandBytecode: Hex = '0x00';
        let encodedInputs: Hex[] = [encodeV3SwapExactIn(swapObj)];

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: UNIVERSAL_ROUTER_ADDRESS,
                        data: encodeFunctionData({
                            abi: universalRouter,
                            functionName: 'execute',
                            args: [commandBytecode, encodedInputs],
                        }),
                    },
                ],
            }),
        );
        expect(result.data).toMatch(`Successfully executed swap using Aerodrome V3 through Universal Router.`);
    });
});
