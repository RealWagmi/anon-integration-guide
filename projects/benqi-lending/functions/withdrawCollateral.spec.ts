import { encodeFunctionData, parseUnits } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import qiAvaxAbi from '../abis/qiAvax';
import qiERC20Abi from '../abis/qiERC20';
import { CORE_MARKETS, ECOSYSTEM_MARKETS, MARKET_DECIMALS } from '../constants';
import { withdrawCollateral } from './withdrawCollateral';

vi.mock('@heyanon/sdk');

describe('withdrawCollateral', () => {
    it('should withdrawCollateral ERC20 tokens from core market', async () => {
        const props: Parameters<typeof withdrawCollateral>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            amount: '2.12',
            marketType: 'core',
            marketName: 'USDC',
        };

        const tools: Parameters<typeof withdrawCollateral>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn(),
        };

        const result = await withdrawCollateral(props, tools);

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: CORE_MARKETS.USDC,
                        data: encodeFunctionData({
                            abi: qiERC20Abi,
                            functionName: 'redeemUnderlying',
                            args: [parseUnits(props.amount, MARKET_DECIMALS)],
                        }),
                    },
                ],
            }),
        );
        expect(result.data).toMatch(`Successfully withdrawn collateral of ${props.amount} tokens.`);
    });

    it('should withdrawCollateral AVAX tokens from core market', async () => {
        const props: Parameters<typeof withdrawCollateral>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            amount: '2.12',
            marketType: 'core',
            marketName: 'AVAX',
        };

        const tools: Parameters<typeof withdrawCollateral>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn(),
        };

        const result = await withdrawCollateral(props, tools);

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: CORE_MARKETS.AVAX,
                        data: encodeFunctionData({
                            abi: qiAvaxAbi,
                            functionName: 'redeemUnderlying',
                            args: [parseUnits(props.amount, MARKET_DECIMALS)],
                        }),
                    },
                ],
            }),
        );
        expect(result.data).toMatch(`Successfully withdrawn collateral of ${props.amount} tokens.`);
    });

    it('should withdrawCollateral ERC20 tokens from ecosystem market', async () => {
        const props: Parameters<typeof withdrawCollateral>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            amount: '2.12',
            marketType: 'ecosystem',
            marketName: 'USDC',
        };

        const tools: Parameters<typeof withdrawCollateral>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn(),
        };

        const result = await withdrawCollateral(props, tools);

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: ECOSYSTEM_MARKETS.USDC,
                        data: encodeFunctionData({
                            abi: qiERC20Abi,
                            functionName: 'redeemUnderlying',
                            args: [parseUnits(props.amount, MARKET_DECIMALS)],
                        }),
                    },
                ],
            }),
        );
        expect(result.data).toMatch(`Successfully withdrawn collateral of ${props.amount} tokens.`);
    });
});
