import { checkToApprove } from '@heyanon/sdk';
import { encodeFunctionData, parseUnits } from 'viem';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import eacAggregatorProxyAbi from '../abis/eacAggregatorProxy';
import igniteAbi from '../abis/ignite';
import { AVAX_ADDRESS, AVAX_DECIMALS, ERC20_PAYMENT_METHODS, IGNITE_ADDRESS, VALIDATION_DURATION_TIME } from '../constants';
import { registerWithStake } from './registerWithStake';

vi.mock('@heyanon/sdk');

const blsProofOfPossession =
    '0xb669f548233c42cceee50cff97a9a112a7e1759a6aa2b6af4a2d73fd79becd3999c86fd188dfa800436c79a1b86a3c77906522b03ddce477bfe913446da6b193314830935042100f814659b803b0678c70273ecdae63c94d94dee2c4ece175b4022e50640b514b301cbb82b31b152c1d2bf1db405b8ca94ca4f3ba6ec6c5da9d0cf45944637025373e983168384a6cee';

describe('registerWithStake', () => {
    beforeEach(() => {
        (checkToApprove as Mock).mockClear();
    });

    it('should error on minimal AVAX amount fetch', async () => {
        const props: Parameters<typeof registerWithStake>[0] = {
            account: '0x0000000000000000000000000000000000000000',
            chainName: 'Avalanche',
            nodeId: 'NodeID-1',
            blsProofOfPossession,
            validationDuration: 'TWO_WEEKS',
            amount: '500',
        };
        const minimumAvaxDeposit = {
            status: 'failure',
            error: new Error('Unable to fetch minimal AVAX amount'),
        };
        const maximumAvaxDeposit = {
            status: 'success',
            data: parseUnits('1800', AVAX_DECIMALS),
        };

        const provider = {
            readContract: vi.fn(),
            multicall: vi.fn().mockReturnValue(Promise.resolve([minimumAvaxDeposit, maximumAvaxDeposit])),
        };

        const tools: Parameters<typeof registerWithStake>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await registerWithStake(props, tools);

        expect(provider.multicall).toHaveBeenCalledWith(
            expect.objectContaining({
                contracts: [
                    {
                        address: IGNITE_ADDRESS,
                        abi: igniteAbi,
                        functionName: 'minimumAvaxDeposit',
                        args: [],
                    },
                    {
                        address: IGNITE_ADDRESS,
                        abi: igniteAbi,
                        functionName: 'maximumAvaxDeposit',
                        args: [],
                    },
                ],
            }),
        );
        expect(result.data).toMatch('Unable to fetch minimal AVAX amount');
    });

    it('should error on maximum AVAX amount fetch', async () => {
        const props: Parameters<typeof registerWithStake>[0] = {
            account: '0x0000000000000000000000000000000000000000',
            chainName: 'Avalanche',
            nodeId: 'NodeID-1',
            blsProofOfPossession,
            validationDuration: 'TWO_WEEKS',
            amount: '500',
        };
        const minimumAvaxDeposit = {
            status: 'success',
            data: parseUnits('500', AVAX_DECIMALS),
        };
        const maximumAvaxDeposit = {
            status: 'failure',
            error: new Error('Unable to fetch maximum AVAX amount'),
        };

        const provider = {
            readContract: vi.fn(),
            multicall: vi.fn().mockReturnValue(Promise.resolve([minimumAvaxDeposit, maximumAvaxDeposit])),
        };

        const tools: Parameters<typeof registerWithStake>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await registerWithStake(props, tools);

        expect(provider.multicall).toHaveBeenCalledWith(
            expect.objectContaining({
                contracts: [
                    {
                        address: IGNITE_ADDRESS,
                        abi: igniteAbi,
                        functionName: 'minimumAvaxDeposit',
                        args: [],
                    },
                    {
                        address: IGNITE_ADDRESS,
                        abi: igniteAbi,
                        functionName: 'maximumAvaxDeposit',
                        args: [],
                    },
                ],
            }),
        );
        expect(result.data).toMatch('Unable to fetch maximum AVAX amount');
    });

    it('should validate if amount is between min and max AVAX amount', async () => {
        const props: Parameters<typeof registerWithStake>[0] = {
            account: '0x0000000000000000000000000000000000000000',
            chainName: 'Avalanche',
            nodeId: 'NodeID-1',
            blsProofOfPossession,
            validationDuration: 'TWO_WEEKS',
            amount: '400',
        };
        const minimumAvaxDeposit = {
            status: 'success',
            result: parseUnits('500', AVAX_DECIMALS),
        };
        const maximumAvaxDeposit = {
            status: 'success',
            result: parseUnits('1800', AVAX_DECIMALS),
        };

        const provider = {
            readContract: vi.fn(),
            multicall: vi.fn().mockReturnValue(Promise.resolve([minimumAvaxDeposit, maximumAvaxDeposit])),
        };

        const tools: Parameters<typeof registerWithStake>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await registerWithStake(props, tools);

        expect(provider.multicall).toHaveBeenCalledWith(
            expect.objectContaining({
                contracts: [
                    {
                        address: IGNITE_ADDRESS,
                        abi: igniteAbi,
                        functionName: 'minimumAvaxDeposit',
                        args: [],
                    },
                    {
                        address: IGNITE_ADDRESS,
                        abi: igniteAbi,
                        functionName: 'maximumAvaxDeposit',
                        args: [],
                    },
                ],
            }),
        );
        expect(result.data).toMatch('Amount must be between 500 and 1800');
    });

    it('should error on qi price feed address fetch', async () => {
        const props: Parameters<typeof registerWithStake>[0] = {
            account: '0x0000000000000000000000000000000000000000',
            chainName: 'Avalanche',
            nodeId: 'NodeID-1',
            blsProofOfPossession,
            validationDuration: 'TWO_WEEKS',
            amount: '500',
        };
        const minimumAvaxDeposit = {
            status: 'success',
            result: parseUnits('500', AVAX_DECIMALS),
        };
        const maximumAvaxDeposit = {
            status: 'success',
            result: parseUnits('1800', AVAX_DECIMALS),
        };
        const qiPriceFeed = {
            status: 'failure',
            error: new Error('Unable to fetch qi price feed'),
        };
        const avaxPriceFeed = {
            status: 'success',
            result: '0x0000000000000000000000000000000000000000',
        };

        const provider = {
            readContract: vi.fn(),
            multicall: vi
                .fn()
                .mockReturnValueOnce(Promise.resolve([minimumAvaxDeposit, maximumAvaxDeposit]))
                .mockReturnValueOnce(Promise.resolve([qiPriceFeed, avaxPriceFeed])),
        };

        const tools: Parameters<typeof registerWithStake>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await registerWithStake(props, tools);

        expect(provider.multicall).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                contracts: [
                    {
                        address: IGNITE_ADDRESS,
                        abi: igniteAbi,
                        functionName: 'priceFeeds',
                        args: [ERC20_PAYMENT_METHODS.Qi],
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
        expect(result.data).toMatch('Unable to fetch qi price feed');
    });

    it('should error on qi latest round fetch', async () => {
        const props: Parameters<typeof registerWithStake>[0] = {
            account: '0x0000000000000000000000000000000000000000',
            chainName: 'Avalanche',
            nodeId: 'NodeID-1',
            blsProofOfPossession,
            validationDuration: 'TWO_WEEKS',
            amount: '500',
        };
        const minimumAvaxDeposit = {
            status: 'success',
            result: parseUnits('500', AVAX_DECIMALS),
        };
        const maximumAvaxDeposit = {
            status: 'success',
            result: parseUnits('1800', AVAX_DECIMALS),
        };
        const qiPriceFeed = {
            status: 'success',
            result: '0x0000000000000000000000000000000000000001',
        };
        const avaxPriceFeed = {
            status: 'success',
            result: '0x0000000000000000000000000000000000000002',
        };
        const qiLatestRound = {
            status: 'failure',
            error: new Error('Unable to fetch qi latest round'),
        };
        const avaxLatestRound = {
            status: 'success',
            result: [0n, 0n, 0n, 0n, 0n],
        };

        const provider = {
            readContract: vi.fn(),
            multicall: vi
                .fn()
                .mockReturnValueOnce(Promise.resolve([minimumAvaxDeposit, maximumAvaxDeposit]))
                .mockReturnValueOnce(Promise.resolve([qiPriceFeed, avaxPriceFeed]))
                .mockReturnValueOnce(Promise.resolve([qiLatestRound, avaxLatestRound])),
        };

        const tools: Parameters<typeof registerWithStake>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await registerWithStake(props, tools);

        expect(provider.multicall).toHaveBeenNthCalledWith(
            3,
            expect.objectContaining({
                contracts: [
                    {
                        address: qiPriceFeed.result,
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
                ],
            }),
        );
        expect(result.data).toMatch('Unable to fetch qi latest round');
    });

    it('should error on avax latest round fetch', async () => {
        const props: Parameters<typeof registerWithStake>[0] = {
            account: '0x0000000000000000000000000000000000000000',
            chainName: 'Avalanche',
            nodeId: 'NodeID-1',
            blsProofOfPossession,
            validationDuration: 'TWO_WEEKS',
            amount: '500',
        };
        const minimumAvaxDeposit = {
            status: 'success',
            result: parseUnits('500', AVAX_DECIMALS),
        };
        const maximumAvaxDeposit = {
            status: 'success',
            result: parseUnits('1800', AVAX_DECIMALS),
        };
        const qiPriceFeed = {
            status: 'success',
            result: '0x0000000000000000000000000000000000000001',
        };
        const avaxPriceFeed = {
            status: 'success',
            result: '0x0000000000000000000000000000000000000002',
        };
        const qiLatestRound = {
            status: 'success',
            result: [0n, 0n, 0n, 0n, 0n],
        };
        const avaxLatestRound = {
            status: 'failure',
            error: new Error('Unable to fetch avax latest round'),
        };

        const provider = {
            readContract: vi.fn(),
            multicall: vi
                .fn()
                .mockReturnValueOnce(Promise.resolve([minimumAvaxDeposit, maximumAvaxDeposit]))
                .mockReturnValueOnce(Promise.resolve([qiPriceFeed, avaxPriceFeed]))
                .mockReturnValueOnce(Promise.resolve([qiLatestRound, avaxLatestRound])),
        };

        const tools: Parameters<typeof registerWithStake>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await registerWithStake(props, tools);

        expect(provider.multicall).toHaveBeenNthCalledWith(
            3,
            expect.objectContaining({
                contracts: [
                    {
                        address: qiPriceFeed.result,
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
                ],
            }),
        );
        expect(result.data).toMatch('Unable to fetch avax latest round');
    });

    it('should register node with fee paid with stake', async () => {
        const props: Parameters<typeof registerWithStake>[0] = {
            account: '0x0000000000000000000000000000000000000000',
            chainName: 'Avalanche',
            nodeId: 'NodeID-1',
            blsProofOfPossession,
            validationDuration: 'TWO_WEEKS',
            amount: '500',
        };
        const minimumAvaxDeposit = {
            status: 'success',
            result: parseUnits('500', AVAX_DECIMALS),
        };
        const maximumAvaxDeposit = {
            status: 'success',
            result: parseUnits('1800', AVAX_DECIMALS),
        };
        const qiPriceFeed = {
            status: 'success',
            result: '0x0000000000000000000000000000000000000001',
        };
        const avaxPriceFeed = {
            status: 'success',
            result: '0x0000000000000000000000000000000000000002',
        };
        const qiLatestRound = {
            status: 'success',
            result: [0n, parseUnits('10', 18), 0n, 0n, 0n],
        };
        const avaxLatestRound = {
            status: 'success',
            result: [0n, parseUnits('20', AVAX_DECIMALS), 0n, 0n, 0n],
        };

        const provider = {
            readContract: vi.fn(),
            multicall: vi
                .fn()
                .mockReturnValueOnce(Promise.resolve([minimumAvaxDeposit, maximumAvaxDeposit]))
                .mockReturnValueOnce(Promise.resolve([qiPriceFeed, avaxPriceFeed]))
                .mockReturnValueOnce(Promise.resolve([qiLatestRound, avaxLatestRound])),
        };

        const tools: Parameters<typeof registerWithStake>[1] = {
            sendTransactions: vi.fn().mockReturnValue(Promise.resolve({ data: ['Result'], isMultisig: false })),
            notify: vi.fn(),
            getProvider: vi.fn().mockReturnValue(provider),
        };

        const result = await registerWithStake(props, tools);

        expect(checkToApprove).toHaveBeenCalledWith(
            expect.objectContaining({
                args: {
                    account: props.account,
                    target: ERC20_PAYMENT_METHODS.Qi,
                    spender: IGNITE_ADDRESS,
                    amount: parseUnits('330', 18),
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
                            functionName: 'registerWithStake',
                            args: [props.nodeId, blsProofOfPossession, VALIDATION_DURATION_TIME.TWO_WEEKS],
                        }),
                        value: parseUnits('500', AVAX_DECIMALS),
                    },
                ],
            }),
        );
        expect(result.data).toMatch(`Successfully registered node ${props.nodeId} with stake`);
    });
});
