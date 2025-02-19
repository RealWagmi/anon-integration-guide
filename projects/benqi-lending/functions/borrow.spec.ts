import { encodeFunctionData, parseUnits } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import qiAvaxAbi from '../abis/qiAvax';
import qiERC20Abi from '../abis/qiERC20';
import { AVAX_DECIMALS, CORE_MARKETS, ECOSYSTEM_MARKETS } from '../constants';
import { borrow } from './borrow';

vi.mock('@heyanon/sdk');

describe('borrow', () => {
    it('should borrow ERC20 tokens from core market', async () => {
        const props: Parameters<typeof borrow>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            amount: '2.12',
            marketType: 'core',
            marketName: 'USDC',
        };

        const underlyingAssetAddress = '0x1234567890123456789012345678901234567891';
        const underlyingDecimals = 6;

        const provider = {
            readContract: vi.fn().mockResolvedValueOnce(underlyingAssetAddress).mockResolvedValueOnce(underlyingDecimals),
        };

        const tools: Parameters<typeof borrow>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await borrow(props, tools);

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: CORE_MARKETS.USDC,
                        data: encodeFunctionData({
                            abi: qiERC20Abi,
                            functionName: 'borrow',
                            args: [parseUnits(props.amount, underlyingDecimals)],
                        }),
                    },
                ],
            }),
        );
        expect(result.data).toMatch(`Successfully borrowed ${props.amount} tokens.`);
    });

    it('should borrow AVAX tokens from core market', async () => {
        const props: Parameters<typeof borrow>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            amount: '2.12',
            marketType: 'core',
            marketName: 'AVAX',
        };

        const tools: Parameters<typeof borrow>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn(),
        };

        const result = await borrow(props, tools);

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: CORE_MARKETS.AVAX,
                        data: encodeFunctionData({
                            abi: qiAvaxAbi,
                            functionName: 'borrow',
                            args: [parseUnits(props.amount, AVAX_DECIMALS)],
                        }),
                    },
                ],
            }),
        );
        expect(result.data).toMatch(`Successfully borrowed ${props.amount} tokens.`);
    });

    it('should borrow ERC20 tokens from ecosystem market', async () => {
        const props: Parameters<typeof borrow>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            amount: '2.12',
            marketType: 'ecosystem',
            marketName: 'USDC',
        };

        const underlyingAssetAddress = '0x1234567890123456789012345678901234567891';
        const underlyingDecimals = 6;

        const provider = {
            readContract: vi.fn().mockResolvedValueOnce(underlyingAssetAddress).mockResolvedValueOnce(underlyingDecimals),
        };

        const tools: Parameters<typeof borrow>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await borrow(props, tools);

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: ECOSYSTEM_MARKETS.USDC,
                        data: encodeFunctionData({
                            abi: qiERC20Abi,
                            functionName: 'borrow',
                            args: [parseUnits(props.amount, underlyingDecimals)],
                        }),
                    },
                ],
            }),
        );
        expect(result.data).toMatch(`Successfully borrowed ${props.amount} tokens.`);
    });
});
