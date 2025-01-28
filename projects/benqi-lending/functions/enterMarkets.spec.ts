import { encodeFunctionData } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import comptrollerAbi from '../abis/comptroller';
import { CORE_COMPTROLLER_ADDRESS, CORE_MARKETS, ECOSYSTEM_MARKETS, ECOSYSTEM_UNITROLLER_ADDRESS } from '../constants';
import { enterMarkets } from './enterMarkets';

vi.mock('@heyanon/sdk');

describe('enterMarkets', () => {
    it('should call enterMarkets of comptroller contract on core market', async () => {
        const props: Parameters<typeof enterMarkets>[0] = {
            account: '0x0000000000000000000000000000000000000000',
            chainName: 'Avalanche',
            marketType: 'core',
            marketNames: ['USDC'],
        };

        const tools: Parameters<typeof enterMarkets>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn(),
        };

        const result = await enterMarkets(props, tools);

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: CORE_COMPTROLLER_ADDRESS,
                        data: encodeFunctionData({
                            abi: comptrollerAbi,
                            functionName: 'enterMarkets',
                            args: [[CORE_MARKETS.USDC]],
                        }),
                    },
                ],
            }),
        );
        expect(result.data).toMatch('Successfully enter 1 markets');
    });

    it('should call enterMarkets of comptroller contract on ecosystem market', async () => {
        const props: Parameters<typeof enterMarkets>[0] = {
            account: '0x0000000000000000000000000000000000000000',
            chainName: 'Avalanche',
            marketType: 'ecosystem',
            marketNames: ['USDC'],
        };

        const tools: Parameters<typeof enterMarkets>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn(),
        };

        const result = await enterMarkets(props, tools);

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: ECOSYSTEM_UNITROLLER_ADDRESS,
                        data: encodeFunctionData({
                            abi: comptrollerAbi,
                            functionName: 'enterMarkets',
                            args: [[ECOSYSTEM_MARKETS.USDC]],
                        }),
                    },
                ],
            }),
        );
        expect(result.data).toMatch('Successfully enter 1 markets');
    });
});
