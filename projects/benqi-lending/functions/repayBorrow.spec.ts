import { checkToApprove } from '@heyanon/sdk';
import { encodeFunctionData, parseUnits } from 'viem';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import qiAvaxAbi from '../abis/qiAvax';
import qiERC20Abi from '../abis/qiERC20';
import { CORE_MARKETS, ECOSYSTEM_MARKETS, MARKET_DECIMALS } from '../constants';
import { repayBorrow } from './repayBorrow';

vi.mock('@heyanon/sdk');

describe('repayBorrow', () => {
    beforeEach(() => {
        (checkToApprove as Mock).mockClear();
    });

    it('should deposit collateral in ERC20 tokens on core market', async () => {
        const props: Parameters<typeof repayBorrow>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            amount: '2.12',
            marketType: 'core',
            marketName: 'USDC',
        };

        const underlyingAssetAddress = '0x1234567890abcdef1234567890abcdef12345678';

        const provider = {
            readContract: vi.fn().mockReturnValue(Promise.resolve(underlyingAssetAddress)),
        };

        const tools: Parameters<typeof repayBorrow>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await repayBorrow(props, tools);

        expect(provider.readContract).toHaveBeenCalledWith({
            abi: qiERC20Abi,
            address: CORE_MARKETS.USDC,
            functionName: 'underlying',
            args: [],
        });

        expect(checkToApprove).toHaveBeenCalledWith(
            expect.objectContaining({
                args: {
                    account: props.account,
                    target: underlyingAssetAddress,
                    spender: CORE_MARKETS.USDC,
                    amount: parseUnits(props.amount, MARKET_DECIMALS),
                },
            }),
        );

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: CORE_MARKETS.USDC,
                        data: encodeFunctionData({
                            abi: qiERC20Abi,
                            functionName: 'repayBorrow',
                            args: [parseUnits(props.amount, MARKET_DECIMALS)],
                        }),
                    },
                ],
            }),
        );
        expect(result.data).toMatch(`Successfully repaid borrow of ${props.amount} tokens.`);
    });

    it('should deposit collateral in AVAX tokens on core market', async () => {
        const props: Parameters<typeof repayBorrow>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            amount: '2.12',
            marketType: 'core',
            marketName: 'AVAX',
        };

        const tools: Parameters<typeof repayBorrow>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn(),
        };

        const result = await repayBorrow(props, tools);

        expect(checkToApprove).not.toHaveBeenCalled();

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: CORE_MARKETS.AVAX,
                        data: encodeFunctionData({
                            abi: qiAvaxAbi,
                            functionName: 'repayBorrow',
                            args: [],
                        }),
                        value: parseUnits(props.amount, MARKET_DECIMALS),
                    },
                ],
            }),
        );
        expect(result.data).toMatch(`Successfully repaid borrow of ${props.amount} tokens.`);
    });

    it('should deposit collateral in ERC20 tokens on ecosystem market', async () => {
        const props: Parameters<typeof repayBorrow>[0] = {
            account: '0x1234567890123456789012345678901234567890',
            chainName: 'Avalanche',
            amount: '2.12',
            marketType: 'ecosystem',
            marketName: 'USDC',
        };

        const underlyingAssetAddress = '0x1234567890abcdef1234567890abcdef12345678';

        const provider = {
            readContract: vi.fn().mockReturnValue(Promise.resolve(underlyingAssetAddress)),
        };

        const tools: Parameters<typeof repayBorrow>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await repayBorrow(props, tools);

        expect(provider.readContract).toHaveBeenCalledWith({
            abi: qiERC20Abi,
            address: ECOSYSTEM_MARKETS.USDC,
            functionName: 'underlying',
            args: [],
        });

        expect(checkToApprove).toHaveBeenCalledWith(
            expect.objectContaining({
                args: {
                    account: props.account,
                    target: underlyingAssetAddress,
                    spender: ECOSYSTEM_MARKETS.USDC,
                    amount: parseUnits(props.amount, MARKET_DECIMALS),
                },
            }),
        );

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: ECOSYSTEM_MARKETS.USDC,
                        data: encodeFunctionData({
                            abi: qiERC20Abi,
                            functionName: 'repayBorrow',
                            args: [parseUnits(props.amount, MARKET_DECIMALS)],
                        }),
                    },
                ],
            }),
        );
        expect(result.data).toMatch(`Successfully repaid borrow of ${props.amount} tokens.`);
    });
});
