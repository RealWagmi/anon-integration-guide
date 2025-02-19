import { encodeFunctionData } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import comptrollerAbi from '../abis/comptroller';
import { CORE_COMPTROLLER_ADDRESS, CORE_MARKETS, ECOSYSTEM_MARKETS, ECOSYSTEM_UNITROLLER_ADDRESS } from '../constants';
import { exitMarket } from './exitMarket';

vi.mock('@heyanon/sdk');

describe('exitMarket', () => {
    it('should call exitMarket of comptroller contract on core market', async () => {
        const props: Parameters<typeof exitMarket>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            marketType: 'core',
            marketName: 'USDC',
        };

        const tools: Parameters<typeof exitMarket>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn(),
        };

        const result = await exitMarket(props, tools);

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: CORE_COMPTROLLER_ADDRESS,
                        data: encodeFunctionData({
                            abi: comptrollerAbi,
                            functionName: 'exitMarket',
                            args: [CORE_MARKETS.USDC],
                        }),
                    },
                ],
            }),
        );
        expect(result.data).toMatch(`Successfully exited ${CORE_MARKETS.USDC} market`);
    });

    it('should call exitMarket of comptroller contract on ecosystem market', async () => {
        const props: Parameters<typeof exitMarket>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            marketType: 'ecosystem',
            marketName: 'USDC',
        };

        const tools: Parameters<typeof exitMarket>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn(),
        };

        const result = await exitMarket(props, tools);

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: ECOSYSTEM_UNITROLLER_ADDRESS,
                        data: encodeFunctionData({
                            abi: comptrollerAbi,
                            functionName: 'exitMarket',
                            args: [ECOSYSTEM_MARKETS.USDC],
                        }),
                    },
                ],
            }),
        );
        expect(result.data).toMatch(`Successfully exited ${ECOSYSTEM_MARKETS.USDC} market`);
    });
});
