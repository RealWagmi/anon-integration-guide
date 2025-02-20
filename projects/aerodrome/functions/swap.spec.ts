import { encodeFunctionData, Hex } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import universalRouter from '../abis/universalRouter';
import { swap } from './swap';
import { CommandCode, UNIVERSAL_ROUTER_ADDRESS } from "../constants";
import { encodePath } from "../utils/path";
import { encodeV3SwapExactIn } from "../utils/encode";

vi.mock('@heyanon/sdk');

describe('swap', () => {
    it('should swap wETH for AERO', async () => {
        const props: Parameters<typeof swap>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Base',
            swap: {
                commandCode: CommandCode.V3_SWAP_EXACT_IN,
                recipient: '0x1234567890123456789012345678901234567891',
                amountIn: '1',
                amountOutMin: '3500',
                path: encodePath([
                    '0x4200000000000000000000000000000000000006',
                    '0x940181a94a35a4569e4529a3cdfb74e38fd98631'
                ], ['V3_LOW']),
                payerIsUser: true
            }
        };

        const provider = {
            readContract: vi.fn(),
        };

        const tools: Parameters<typeof swap>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await swap(props, tools);

        // build command and input bytecode
        let commandBytecode: Hex = '0x00';
        let encodedInputs: Hex[] = [encodeV3SwapExactIn(props.swap)];

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
        expect(result.data).toMatch(`Successfully executed swap through Universal Router.`);
    });
});
