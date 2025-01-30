import { Address, parseUnits } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import chainlinkOracleAbi from '../abis/chainlinkOracle';
import comptrollerAbi from '../abis/comptroller';
import { CORE_COMPTROLLER_ADDRESS, CORE_MARKETS, ECOSYSTEM_MARKETS, ECOSYSTEM_UNITROLLER_ADDRESS, LIQUIDITY_DECIMALS, MARKET_DECIMALS, MarketProps } from '../constants';
import { getMarketBorrowLimit } from './getMarketBorrowLimit';

vi.mock('@heyanon/sdk');

describe('getMarketBorrowLimit', () => {
    describe.each`
        marketType     | marketName | marketAddress
        ${'core'}      | ${'USDC'}  | ${CORE_MARKETS.USDC}
        ${'ecosystem'} | ${'USDC'}  | ${ECOSYSTEM_MARKETS.USDC}
    `('marketType $marketType', ({ marketType, marketName, marketAddress }: MarketProps & { marketAddress: Address }) => {
        it('should fail to fetch token price', async () => {
            const props: Parameters<typeof getMarketBorrowLimit>[0] = {
                account: '0x1234567890123456789012345678901234567890',
                chainName: 'Avalanche',
                ...({
                    marketType,
                    marketName,
                } as MarketProps),
            };

            const oracleAddress = '0x1234567890123456789012345678901234567891';

            const tokenPrice = {
                status: 'failure',
                error: new Error('Error fetching token price'),
            };

            const liquidity = {
                status: 'success',
                data: [0, 0n, 0n],
            };

            const provider = {
                readContract: vi.fn().mockReturnValue(Promise.resolve(oracleAddress)),
                multicall: vi.fn().mockReturnValue(Promise.resolve([tokenPrice, liquidity])),
            };

            const tools: Parameters<typeof getMarketBorrowLimit>[1] = {
                sendTransactions: vi.fn(),
                notify: vi.fn(),
                getProvider: vi.fn().mockReturnValue(provider),
            };

            const result = await getMarketBorrowLimit(props, tools);

            expect(provider.readContract).toHaveBeenCalledWith(
                expect.objectContaining({
                    abi: comptrollerAbi,
                    address: marketType === 'core' ? CORE_COMPTROLLER_ADDRESS : ECOSYSTEM_UNITROLLER_ADDRESS,
                    functionName: 'oracle',
                    args: [],
                }),
            );
            expect(provider.multicall).toHaveBeenCalledWith({
                contracts: [
                    expect.objectContaining({
                        abi: chainlinkOracleAbi,
                        address: oracleAddress,
                        functionName: 'getUnderlyingPrice',
                        args: [marketAddress],
                    }),
                    expect.objectContaining({
                        abi: comptrollerAbi,
                        address: marketType === 'core' ? CORE_COMPTROLLER_ADDRESS : ECOSYSTEM_UNITROLLER_ADDRESS,
                        functionName: 'getAccountLiquidity',
                        args: [props.account],
                    }),
                ],
            });
            expect(result.data).toMatch('Error fetching token price');
        });

        it('should fail to get account liquidity', async () => {
            const props: Parameters<typeof getMarketBorrowLimit>[0] = {
                account: '0x1234567890123456789012345678901234567890',
                chainName: 'Avalanche',
                ...({
                    marketType,
                    marketName,
                } as MarketProps),
            };

            const oracleAddress = '0x1234567890123456789012345678901234567891';

            const tokenPrice = {
                status: 'success',
                result: 1n,
            };

            const liquidity = {
                status: 'failure',
                error: new Error('Error fetching account liquidity'),
            };

            const provider = {
                readContract: vi.fn().mockReturnValue(Promise.resolve(oracleAddress)),
                multicall: vi.fn().mockReturnValue(Promise.resolve([tokenPrice, liquidity])),
            };

            const tools: Parameters<typeof getMarketBorrowLimit>[1] = {
                sendTransactions: vi.fn(),
                notify: vi.fn(),
                getProvider: vi.fn().mockReturnValue(provider),
            };

            const result = await getMarketBorrowLimit(props, tools);

            expect(provider.readContract).toHaveBeenCalledWith(
                expect.objectContaining({
                    abi: comptrollerAbi,
                    address: marketType === 'core' ? CORE_COMPTROLLER_ADDRESS : ECOSYSTEM_UNITROLLER_ADDRESS,
                    functionName: 'oracle',
                    args: [],
                }),
            );
            expect(provider.multicall).toHaveBeenCalledWith({
                contracts: [
                    expect.objectContaining({
                        abi: chainlinkOracleAbi,
                        address: oracleAddress,
                        functionName: 'getUnderlyingPrice',
                        args: [marketAddress],
                    }),
                    expect.objectContaining({
                        abi: comptrollerAbi,
                        address: marketType === 'core' ? CORE_COMPTROLLER_ADDRESS : ECOSYSTEM_UNITROLLER_ADDRESS,
                        functionName: 'getAccountLiquidity',
                        args: [props.account],
                    }),
                ],
            });
            expect(result.data).toMatch('Error fetching account liquidity');
        });

        it('should return internal liquidity error', async () => {
            const props: Parameters<typeof getMarketBorrowLimit>[0] = {
                account: '0x1234567890123456789012345678901234567890',
                chainName: 'Avalanche',
                ...({
                    marketType,
                    marketName,
                } as MarketProps),
            };

            const oracleAddress = '0x1234567890123456789012345678901234567891';

            const tokenPrice = {
                status: 'success',
                result: 1n,
            };

            const liquidity = {
                status: 'success',
                result: [10, 0n, 0n],
            };

            const provider = {
                readContract: vi.fn().mockReturnValue(Promise.resolve(oracleAddress)),
                multicall: vi.fn().mockReturnValue(Promise.resolve([tokenPrice, liquidity])),
            };

            const tools: Parameters<typeof getMarketBorrowLimit>[1] = {
                sendTransactions: vi.fn(),
                notify: vi.fn(),
                getProvider: vi.fn().mockReturnValue(provider),
            };

            const result = await getMarketBorrowLimit(props, tools);

            expect(provider.readContract).toHaveBeenCalledWith(
                expect.objectContaining({
                    abi: comptrollerAbi,
                    address: marketType === 'core' ? CORE_COMPTROLLER_ADDRESS : ECOSYSTEM_UNITROLLER_ADDRESS,
                    functionName: 'oracle',
                    args: [],
                }),
            );
            expect(provider.multicall).toHaveBeenCalledWith({
                contracts: [
                    expect.objectContaining({
                        abi: chainlinkOracleAbi,
                        address: oracleAddress,
                        functionName: 'getUnderlyingPrice',
                        args: [marketAddress],
                    }),
                    expect.objectContaining({
                        abi: comptrollerAbi,
                        address: marketType === 'core' ? CORE_COMPTROLLER_ADDRESS : ECOSYSTEM_UNITROLLER_ADDRESS,
                        functionName: 'getAccountLiquidity',
                        args: [props.account],
                    }),
                ],
            });
            expect(result.data).toMatch('Error code 10');
        });

        it('calculate borrow limit', async () => {
            const props: Parameters<typeof getMarketBorrowLimit>[0] = {
                account: '0x1234567890123456789012345678901234567890',
                chainName: 'Avalanche',
                ...({
                    marketType,
                    marketName,
                } as MarketProps),
            };

            const oracleAddress = '0x1234567890123456789012345678901234567891';

            const tokenPrice = {
                status: 'success',
                result: parseUnits('2', MARKET_DECIMALS),
            };

            const liquidity = {
                status: 'success',
                result: [0, parseUnits('200', LIQUIDITY_DECIMALS), 0n],
            };

            const provider = {
                readContract: vi.fn().mockReturnValue(Promise.resolve(oracleAddress)),
                multicall: vi.fn().mockReturnValue(Promise.resolve([tokenPrice, liquidity])),
            };

            const tools: Parameters<typeof getMarketBorrowLimit>[1] = {
                sendTransactions: vi.fn(),
                notify: vi.fn(),
                getProvider: vi.fn().mockReturnValue(provider),
            };

            const result = await getMarketBorrowLimit(props, tools);

            expect(provider.readContract).toHaveBeenCalledWith(
                expect.objectContaining({
                    abi: comptrollerAbi,
                    address: marketType === 'core' ? CORE_COMPTROLLER_ADDRESS : ECOSYSTEM_UNITROLLER_ADDRESS,
                    functionName: 'oracle',
                    args: [],
                }),
            );
            expect(provider.multicall).toHaveBeenCalledWith({
                contracts: [
                    expect.objectContaining({
                        abi: chainlinkOracleAbi,
                        address: oracleAddress,
                        functionName: 'getUnderlyingPrice',
                        args: [marketAddress],
                    }),
                    expect.objectContaining({
                        abi: comptrollerAbi,
                        address: marketType === 'core' ? CORE_COMPTROLLER_ADDRESS : ECOSYSTEM_UNITROLLER_ADDRESS,
                        functionName: 'getAccountLiquidity',
                        args: [props.account],
                    }),
                ],
            });
            expect(result.data).toMatch(`Your market borrow limit for ${marketName} token: 100`);
        });
    });
});
