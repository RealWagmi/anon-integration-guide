import { checkToApprove } from '@heyanon/sdk';
import { encodeFunctionData, erc20Abi, parseUnits } from 'viem';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import eacAggregatorProxyAbi from '../abis/eacAggregatorProxy';
import igniteAbi from '../abis/ignite';
import { AVAX_ADDRESS, AVAX_DECIMALS, ERC20_PAYMENT_METHODS, IGNITE_ADDRESS, VALIDATION_DURATION_TIME } from '../constants';
import { registerWithErc20Fee } from './registerWithErc20Fee';

vi.mock('@heyanon/sdk');

const blsProofOfPossession =
    '0xb669f548233c42cceee50cff97a9a112a7e1759a6aa2b6af4a2d73fd79becd3999c86fd188dfa800436c79a1b86a3c77906522b03ddce477bfe913446da6b193314830935042100f814659b803b0678c70273ecdae63c94d94dee2c4ece175b4022e50640b514b301cbb82b31b152c1d2bf1db405b8ca94ca4f3ba6ec6c5da9d0cf45944637025373e983168384a6cee';

describe('registerWithErc20Fee', () => {
    beforeEach(() => {
        (checkToApprove as Mock).mockClear();
    });

    it('should error on payment method price feed fetch', async () => {
        const props: Parameters<typeof registerWithErc20Fee>[0] = {
            account: '0x0000000000000000000000000000000000000000',
            chainName: 'Avalanche',
            nodeId: 'NodeID-1',
            blsProofOfPossession,
            paymentMethod: 'USDC',
            validationDuration: 'TWO_WEEKS',
        };
        const paymentMethodPriceFeed = {
            status: 'failure',
            error: new Error('Unable to fetch payment method price feed'),
        };
        const avaxPriceFeed = {
            status: 'success',
            data: '0x0000000000000000000000000000000000000000',
        };

        const provider = {
            readContract: vi.fn(),
            multicall: vi.fn().mockReturnValue(Promise.resolve([paymentMethodPriceFeed, avaxPriceFeed])),
        };

        const tools: Parameters<typeof registerWithErc20Fee>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await registerWithErc20Fee(props, tools);

        expect(provider.multicall).toHaveBeenCalledWith(
            expect.objectContaining({
                contracts: [
                    {
                        address: IGNITE_ADDRESS,
                        abi: igniteAbi,
                        functionName: 'priceFeeds',
                        args: [ERC20_PAYMENT_METHODS.USDC],
                    },
                    {
                        address: IGNITE_ADDRESS,
                        abi: igniteAbi,
                        functionName: 'priceFeeds',
                        args: [AVAX_ADDRESS],
                    },
                ],
            }),
        );
        expect(result.data).toMatch('Unable to fetch payment method price feed');
    });

    it('should error on fetch avax price feed fetch', async () => {
        const props: Parameters<typeof registerWithErc20Fee>[0] = {
            account: '0x0000000000000000000000000000000000000000',
            chainName: 'Avalanche',
            nodeId: 'NodeID-1',
            blsProofOfPossession,
            paymentMethod: 'USDC',
            validationDuration: 'TWO_WEEKS',
        };
        const paymentMethodPriceFeed = {
            status: 'success',
            data: '0x0000000000000000000000000000000000000000',
        };
        const avaxPriceFeed = {
            status: 'failure',
            error: new Error('Unable to fetch avax price feed'),
        };

        const provider = {
            readContract: vi.fn(),
            multicall: vi.fn().mockReturnValue(Promise.resolve([paymentMethodPriceFeed, avaxPriceFeed])),
        };

        const tools: Parameters<typeof registerWithErc20Fee>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await registerWithErc20Fee(props, tools);

        expect(provider.multicall).toHaveBeenCalledWith(
            expect.objectContaining({
                contracts: [
                    {
                        address: IGNITE_ADDRESS,
                        abi: igniteAbi,
                        functionName: 'priceFeeds',
                        args: [ERC20_PAYMENT_METHODS.USDC],
                    },
                    {
                        address: IGNITE_ADDRESS,
                        abi: igniteAbi,
                        functionName: 'priceFeeds',
                        args: [AVAX_ADDRESS],
                    },
                ],
            }),
        );
        expect(result.data).toMatch('Unable to fetch avax price feed');
    });

    [
        [
            {
                status: 'failure',
                error: new Error('Unable to fetch payment method last round'),
            },
            {
                status: 'success',
                result: [0n, 0n, 0n, 0n, 0n],
            },
            {
                status: 'success',
                result: 18,
            },
            new Error('Unable to fetch payment method last round'),
        ] as const,
        [
            {
                status: 'success',
                result: [0n, 0n, 0n, 0n, 0n],
            },
            {
                status: 'failure',
                error: new Error('Unable to fetch avax last round'),
            },
            {
                status: 'success',
                result: 18,
            },
            new Error('Unable to fetch avax last round'),
        ] as const,
        [
            {
                status: 'success',
                result: [0n, 0n, 0n, 0n, 0n],
            },
            {
                status: 'success',
                result: [0n, 0n, 0n, 0n, 0n],
            },
            {
                status: 'failure',
                error: new Error('Unable to payment method decimals'),
            },
            new Error('Unable to payment method decimals'),
        ] as const,
    ].forEach(([paymentMethodLatestRound, avaxLatestRound, paymentMethodDecimals, error]) => {
        it(`should return error ${error.message}`, async () => {
            const props: Parameters<typeof registerWithErc20Fee>[0] = {
                account: '0x0000000000000000000000000000000000000000',
                chainName: 'Avalanche',
                nodeId: 'NodeID-1',
                blsProofOfPossession,
                paymentMethod: 'USDC',
                validationDuration: 'TWO_WEEKS',
            };
            const paymentMethodPriceFeed = {
                status: 'success',
                result: '0x0000000000000000000000000000000000000001',
            };
            const avaxPriceFeed = {
                status: 'success',
                result: '0x0000000000000000000000000000000000000002',
            };

            const provider = {
                readContract: vi.fn(),
                multicall: vi
                    .fn()
                    .mockReturnValueOnce(Promise.resolve([paymentMethodPriceFeed, avaxPriceFeed]))
                    .mockReturnValueOnce([paymentMethodLatestRound, avaxLatestRound, paymentMethodDecimals]),
            };

            const tools: Parameters<typeof registerWithErc20Fee>[1] = {
                sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
                notify: vi.fn(),
                getProvider: vi.fn().mockReturnValue(provider),
            };

            const result = await registerWithErc20Fee(props, tools);

            expect(provider.multicall).toHaveBeenNthCalledWith(
                1,
                expect.objectContaining({
                    contracts: [
                        {
                            address: IGNITE_ADDRESS,
                            abi: igniteAbi,
                            functionName: 'priceFeeds',
                            args: [ERC20_PAYMENT_METHODS.USDC],
                        },
                        {
                            address: IGNITE_ADDRESS,
                            abi: igniteAbi,
                            functionName: 'priceFeeds',
                            args: [AVAX_ADDRESS],
                        },
                    ],
                }),
            );
            expect(provider.multicall).toHaveBeenNthCalledWith(
                2,
                expect.objectContaining({
                    contracts: [
                        {
                            address: paymentMethodPriceFeed.result,
                            abi: eacAggregatorProxyAbi,
                            functionName: 'latestRoundData',
                            args: [],
                        },
                        {
                            address: avaxPriceFeed.result,
                            abi: eacAggregatorProxyAbi,
                            functionName: 'latestRoundData',
                            args: [],
                        },
                        {
                            address: ERC20_PAYMENT_METHODS.USDC,
                            abi: erc20Abi,
                            functionName: 'decimals',
                            args: [],
                        },
                    ],
                }),
            );
            expect(result.data).toMatch(error.message);
        });
    });

    it('should register nodeId with fee paid in USDC', async () => {
        const props: Parameters<typeof registerWithErc20Fee>[0] = {
            account: '0x0000000000000000000000000000000000000000',
            chainName: 'Avalanche',
            nodeId: 'NodeID-1',
            blsProofOfPossession,
            paymentMethod: 'USDC',
            validationDuration: 'TWO_WEEKS',
        };
        const paymentMethodPriceFeed = {
            status: 'success',
            result: '0x0000000000000000000000000000000000000001',
        };
        const avaxPriceFeed = {
            status: 'success',
            result: '0x0000000000000000000000000000000000000002',
        };
        const paymentMethodLatestRound = {
            status: 'success',
            result: [0n, parseUnits('20', 18), 0n, 0n, 0n],
        };
        const avaxLatestRound = {
            status: 'success',
            result: [0n, parseUnits('10', AVAX_DECIMALS), 0n, 0n, 0n],
        };
        const paymentMethodDecimals = {
            status: 'success',
            result: 18,
        };

        const provider = {
            readContract: vi.fn(),
            multicall: vi
                .fn()
                .mockReturnValueOnce(Promise.resolve([paymentMethodPriceFeed, avaxPriceFeed]))
                .mockReturnValueOnce([paymentMethodLatestRound, avaxLatestRound, paymentMethodDecimals]),
        };

        const tools: Parameters<typeof registerWithErc20Fee>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await registerWithErc20Fee(props, tools);

        expect(checkToApprove).toHaveBeenCalledWith(
            expect.objectContaining({
                args: {
                    account: props.account,
                    target: ERC20_PAYMENT_METHODS.USDC,
                    spender: IGNITE_ADDRESS,
                    amount: parseUnits('4.4', 18),
                },
            }),
        );

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: IGNITE_ADDRESS,
                        data: encodeFunctionData({
                            abi: igniteAbi,
                            functionName: 'registerWithErc20Fee',
                            args: [ERC20_PAYMENT_METHODS.USDC, props.nodeId, blsProofOfPossession, VALIDATION_DURATION_TIME.TWO_WEEKS],
                        }),
                    },
                ],
            }),
        );

        expect(result.data).toMatch(`Successfully registered node ${props.nodeId} with USDC token`);
    });

    it('should register nodeId with fee paid in Qi', async () => {
        const props: Parameters<typeof registerWithErc20Fee>[0] = {
            account: '0x0000000000000000000000000000000000000000',
            chainName: 'Avalanche',
            nodeId: 'NodeID-1',
            blsProofOfPossession,
            paymentMethod: 'Qi',
            validationDuration: 'TWO_WEEKS',
        };
        const paymentMethodPriceFeed = {
            status: 'success',
            result: '0x0000000000000000000000000000000000000001',
        };
        const avaxPriceFeed = {
            status: 'success',
            result: '0x0000000000000000000000000000000000000002',
        };
        const paymentMethodLatestRound = {
            status: 'success',
            result: [0n, parseUnits('20', 18), 0n, 0n, 0n],
        };
        const avaxLatestRound = {
            status: 'success',
            result: [0n, parseUnits('10', AVAX_DECIMALS), 0n, 0n, 0n],
        };
        const paymentMethodDecimals = {
            status: 'success',
            result: 18,
        };
        const qiPriceMultiplier = 10_000n;

        const provider = {
            readContract: vi.fn().mockReturnValue(Promise.resolve(qiPriceMultiplier)),
            multicall: vi
                .fn()
                .mockReturnValueOnce(Promise.resolve([paymentMethodPriceFeed, avaxPriceFeed]))
                .mockReturnValueOnce([paymentMethodLatestRound, avaxLatestRound, paymentMethodDecimals]),
        };

        const tools: Parameters<typeof registerWithErc20Fee>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await registerWithErc20Fee(props, tools);

        expect(provider.readContract).toHaveBeenCalledWith({
            address: IGNITE_ADDRESS,
            abi: igniteAbi,
            functionName: 'qiPriceMultiplier',
            args: [],
        });

        expect(checkToApprove).toHaveBeenCalledWith(
            expect.objectContaining({
                args: {
                    account: props.account,
                    target: ERC20_PAYMENT_METHODS.Qi,
                    spender: IGNITE_ADDRESS,
                    amount: parseUnits('4.4', 18),
                },
            }),
        );

        expect(tools.sendTransactions).toHaveBeenCalledWith(
            expect.objectContaining({
                transactions: [
                    {
                        target: IGNITE_ADDRESS,
                        data: encodeFunctionData({
                            abi: igniteAbi,
                            functionName: 'registerWithErc20Fee',
                            args: [ERC20_PAYMENT_METHODS.Qi, props.nodeId, blsProofOfPossession, VALIDATION_DURATION_TIME.TWO_WEEKS],
                        }),
                    },
                ],
            }),
        );

        expect(result.data).toMatch(`Successfully registered node ${props.nodeId} with Qi token`);
    });
});
