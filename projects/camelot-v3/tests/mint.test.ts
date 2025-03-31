import { exactInputSingle, mint } from '../functions';
import { Address, decodeFunctionData } from 'viem';
import { ChainId, SendTransactionProps, toResult, TransactionReturn } from '@heyanon/sdk';
import { TransactionParams } from '@heyanon/sdk/dist/blockchain/types';
import { ADDRESSES, MAX_TICK, MIN_TICK, ZERO_ADDRESS } from '../constants';
import { nonFungiblePositionManagerAbi } from '../abis/nonFungiblePositionManagerAbi';

// Test data taken from: https://arbiscan.io/tx/0xe02e9729a5c5762ff0d431504136e60fb0ab24561dc1e1cee96da8599337abb4
const chainId = ChainId.ARBITRUM;
const spender = '0x0419959C9ffF74FEaC47e51D5869fabcA61FFF15' as Address;
const pool = '0xc23f308CF1bFA7efFFB592920a619F00990F8D74' as Address;
const tokenA = '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34' as Address; // USD.e
const tokenB = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as Address; // USDC
const deadline = 1737101308;
const tokenADecimals = 18;
const tokenBDecimals = 6;
const lowerPrice = '0.9999026535686368';
const upperPrice = '1.0007028557202362';

jest.mock('@heyanon/sdk', () => ({
    ...jest.requireActual('@heyanon/sdk'),
    checkToApprove: jest.fn((props: any) => {
        if (props.args.account != spender) {
            throw new Error('Invalid account');
        }
        if (props.args.target != tokenA && props.args.target != tokenB) {
            throw new Error('Invalid target');
        }
        if (props.args.spender != ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS) {
            throw new Error('Invalid spender');
        }
        if (props.args.amount <= 0n) {
            throw new Error('Invalid amount');
        }
        return Promise.resolve();
    }),
}));

const mockNotify = jest.fn((message: string) => {
    console.log(message);
    return Promise.resolve();
});

const createMockGetProvider = (overrides: any = {}) =>
    jest.fn().mockReturnValue({
        readContract: jest.fn((readContractProps: any) => {
            switch (readContractProps.functionName) {
                case 'decimals':
                    switch (readContractProps.address) {
                        case tokenA:
                            return Promise.resolve(tokenADecimals);
                        case tokenB:
                            return Promise.resolve(tokenBDecimals);
                        default:
                            throw new Error(`Invalid token ${readContractProps.address}`);
                    }
                case 'symbol':
                    switch (readContractProps.address) {
                        case tokenA:
                            return Promise.resolve('USD.e');
                        case tokenB:
                            return Promise.resolve('USDC');
                        default:
                            throw new Error(`Invalid token ${readContractProps.address}`);
                    }
                case 'poolByPair':
                    return Promise.resolve(pool);
                case 'tickSpacing':
                    return Promise.resolve(1);
                default:
                    throw new Error(`Invalid function ${readContractProps.functionName}`);
            }
        }),
        multicall: jest.fn((multicallProps: any) => {
            return Promise.resolve([{ result: tokenA }, { result: tokenB }, { result: 1 }, { result: [79224581245752470721102n, -276320] }]);
        }),
        getTransactionReceipt: jest.fn(() => {
            return Promise.resolve({
                logs: [
                    {
                        address: '0xc23f308CF1bFA7efFFB592920a619F00990F8D74',
                        topics: ['0x7a53080ba414158be7ec69b987b5fb7d07dee101fe85488f0853ae16239d0bde', '0x00000000000000000000000000c7f3082833e796a5b3e4bd59f6642ff44dcd15', '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffbc89b', '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffbc8a3'],
                        data: '0x00000000000000000000000000c7f3082833e796a5b3e4bd59f6642ff44dcd1500000000000000000000000000000000000000000000000022b0bca0fe6e9d4f000000000000000000000000000000000000000000000035b8e3007ad02cf2e70000000000000000000000000000000000000000000000000000000000847288',
                        blockNumber: 0,
                        transactionHash: '0x',
                        transactionIndex: 0,
                        blockHash: '0x',
                        logIndex: 0,
                        removed: false,
                    },
                ],
            });
        }),
        ...overrides,
    });

const createMockSendTransactions = (capturedTransactions: TransactionParams[]) =>
    jest.fn((props: SendTransactionProps): Promise<TransactionReturn> => {
        capturedTransactions.push(...props.transactions);
        return Promise.resolve({
            isMultisig: false,
            data: [{ message: 'Transaction successful', hash: '0x' }],
        });
    });

describe('mint', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        jest.spyOn(Date, 'now').mockImplementation(() => (deadline - 5 * 60) * 1000);
    });

    const props = {
        chainName: 'arbitrum-one',
        account: spender,
        tokenA: tokenA,
        tokenB: tokenB,
        amountA: '991.000000753028705765',
        amountB: '8.680072',
        recipient: spender,
        lowerPrice: lowerPrice,
        upperPrice: upperPrice,
        slippage: 250,
        baseToken: tokenA,
        quoteToken: tokenB,
    };

    it('should prepare and send transactions correctly', async () => {
        let capturedTransactions: TransactionParams[] = [];
        const mockSendTransactions = createMockSendTransactions(capturedTransactions);
        const mockGetProvider = createMockGetProvider();

        const result = await mint(props, {
            notify: mockNotify,
            sendTransactions: mockSendTransactions,
            getProvider: mockGetProvider,
        });

        expect(result.success).toEqual(true);
        expect(result.data).toContain('success');

        expect(capturedTransactions).toHaveLength(1);
        expect(capturedTransactions[0].target).toEqual(ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS);
        expect(capturedTransactions[0].data).toEqual(
            '0xac9650d800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000001449cc1a2830000000000000000000000005d3a1ff2b6bab83b63cd9ad0787074081a52ef34000000000000000000000000af88d065e77c8cc2239327c5edb3a432268e5831fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffbc89bfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffbc8a3000000000000000000000000000000000000000000000035b8e34224501e2de50000000000000000000000000000000000000000000000000000000000847288000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000419959c9fff74feac47e51d5869fabca61fff1500000000000000000000000000000000000000000000000000000000678a0ffc00000000000000000000000000000000000000000000000000000000',
        );
    });

    it('should set the lowerPrice and upperPrice if set in percentage', async () => {
        let capturedTransactions: TransactionParams[] = [];
        const mockSendTransactions = createMockSendTransactions(capturedTransactions);
        const mockGetProvider = createMockGetProvider();

        const result = await mint(
            {
                ...props,
                lowerPrice: undefined,
                upperPrice: undefined,
                lowerPricePercentage: 500,
                upperPricePercentage: 2000,
            },
            {
                notify: mockNotify,
                sendTransactions: mockSendTransactions,
                getProvider: mockGetProvider,
            },
        );

        const decodedMulticall = decodeFunctionData({
            abi: nonFungiblePositionManagerAbi,
            data: capturedTransactions[0].data,
        });
        const decodedCall = decodeFunctionData({
            abi: nonFungiblePositionManagerAbi,
            data: (decodedMulticall.args[0] as any)[0],
        });

        expect(result.success).toEqual(true);
        expect(result.data).toContain('success');

        expect(capturedTransactions).toHaveLength(1);
        expect(capturedTransactions[0].target).toEqual(ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS);

        expect((decodedCall.args[0] as any).tickLower).toEqual(-276833);
        expect((decodedCall.args[0] as any).tickUpper).toEqual(-274497);
    });

    it('should bound the lowerPrice and upperPrice if undefined', async () => {
        let capturedTransactions: TransactionParams[] = [];
        const mockSendTransactions = createMockSendTransactions(capturedTransactions);
        const mockGetProvider = createMockGetProvider();

        const result = await mint(
            { ...props, lowerPrice: undefined, upperPrice: undefined },
            {
                notify: mockNotify,
                sendTransactions: mockSendTransactions,
                getProvider: mockGetProvider,
            },
        );

        const decodedMulticall = decodeFunctionData({
            abi: nonFungiblePositionManagerAbi,
            data: capturedTransactions[0].data,
        });
        const decodedCall = decodeFunctionData({
            abi: nonFungiblePositionManagerAbi,
            data: (decodedMulticall.args[0] as any)[0],
        });

        expect(result.success).toEqual(true);
        expect(result.data).toContain('success');

        expect(capturedTransactions).toHaveLength(1);
        expect(capturedTransactions[0].target).toEqual(ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS);

        expect((decodedCall.args[0] as any).tickLower).toEqual(MIN_TICK);
        expect((decodedCall.args[0] as any).tickUpper).toEqual(MAX_TICK);
    });

    it('should set the recipient correctly', async () => {
        let capturedTransactions: TransactionParams[] = [];
        const mockSendTransactions = createMockSendTransactions(capturedTransactions);
        const mockGetProvider = createMockGetProvider();

        const newRecipient = '0x000000000000000000000000000000000000dEaD' as Address;
        const result = await mint(
            { ...props, recipient: newRecipient },
            {
                notify: mockNotify,
                sendTransactions: mockSendTransactions,
                getProvider: mockGetProvider,
            },
        );

        const decodedMulticall = decodeFunctionData({
            abi: nonFungiblePositionManagerAbi,
            data: capturedTransactions[0].data,
        });
        const decodedCall = decodeFunctionData({
            abi: nonFungiblePositionManagerAbi,
            data: (decodedMulticall.args[0] as any)[0],
        });

        expect(result.success).toEqual(true);
        expect(result.data).toContain('success');

        expect(capturedTransactions).toHaveLength(1);
        expect(capturedTransactions[0].target).toEqual(ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS);

        expect((decodedCall.args[0] as any).recipient).toEqual(newRecipient);
    });

    it('should adjust the tickLower and tickUpper if they match (below current tick)', async () => {
        let capturedTransactions: TransactionParams[] = [];
        const mockSendTransactions = createMockSendTransactions(capturedTransactions);
        const mockGetProvider = createMockGetProvider();

        const result = await mint(
            { ...props, lowerPrice: lowerPrice, upperPrice: lowerPrice },
            {
                notify: mockNotify,
                sendTransactions: mockSendTransactions,
                getProvider: mockGetProvider,
            },
        );

        const decodedMulticall = decodeFunctionData({
            abi: nonFungiblePositionManagerAbi,
            data: capturedTransactions[0].data,
        });
        const decodedCall = decodeFunctionData({
            abi: nonFungiblePositionManagerAbi,
            data: (decodedMulticall.args[0] as any)[0],
        });

        expect(result.success).toEqual(true);
        expect(result.data).toContain('success');

        expect(capturedTransactions).toHaveLength(1);
        expect(capturedTransactions[0].target).toEqual(ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS);

        expect((decodedCall.args[0] as any).tickLower).toEqual(-276326);
        expect((decodedCall.args[0] as any).tickUpper).toEqual(-276325);
    });

    it('should adjust the tickLower and tickUpper if they match (above current tick)', async () => {
        let capturedTransactions: TransactionParams[] = [];
        const mockSendTransactions = createMockSendTransactions(capturedTransactions);
        const mockGetProvider = createMockGetProvider();

        const result = await mint(
            { ...props, lowerPrice: '100', upperPrice: '100' },
            {
                notify: mockNotify,
                sendTransactions: mockSendTransactions,
                getProvider: mockGetProvider,
            },
        );

        const decodedMulticall = decodeFunctionData({
            abi: nonFungiblePositionManagerAbi,
            data: capturedTransactions[0].data,
        });
        const decodedCall = decodeFunctionData({
            abi: nonFungiblePositionManagerAbi,
            data: (decodedMulticall.args[0] as any)[0],
        });

        expect(result.success).toEqual(true);
        expect(result.data).toContain('success');

        expect(capturedTransactions).toHaveLength(1);
        expect(capturedTransactions[0].target).toEqual(ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS);

        expect((decodedCall.args[0] as any).tickLower).toEqual(-230271);
        expect((decodedCall.args[0] as any).tickUpper).toEqual(-230270);
    });

    it('should return an error if poolByPair() fails', async () => {
        const mockGetProvider = createMockGetProvider({
            readContract: jest.fn((readContractProps: any) => {
                switch (readContractProps.functionName) {
                    case 'decimals':
                        if (readContractProps.address == props.tokenA) {
                            return Promise.resolve(tokenADecimals);
                        }
                        if (readContractProps.address == props.tokenB) {
                            return Promise.resolve(tokenBDecimals);
                        }
                        break;
                    case 'poolByPair':
                        throw new Error('Invalid pool');
                    default:
                        throw new Error('Invalid function');
                }
            }),
        });

        const result = await mint(props, {
            notify: mockNotify,
            sendTransactions: jest.fn(),
            getProvider: mockGetProvider,
        });

        expect(result).toEqual(toResult(`Pool for pair (${props.tokenA}, ${props.tokenB}) not found`, true));
    });

    it('should return an error if poolByPair() returns ZERO address', async () => {
        const mockGetProvider = createMockGetProvider({
            readContract: jest.fn((readContractProps: any) => {
                switch (readContractProps.functionName) {
                    case 'decimals':
                        if (readContractProps.address == props.tokenA) {
                            return Promise.resolve(tokenADecimals);
                        }
                        if (readContractProps.address == props.tokenB) {
                            return Promise.resolve(tokenBDecimals);
                        }
                        break;
                    case 'poolByPair':
                        return Promise.resolve(ZERO_ADDRESS);
                    default:
                        throw new Error('Invalid function');
                }
            }),
        });

        const result = await mint(props, {
            notify: mockNotify,
            sendTransactions: jest.fn(),
            getProvider: mockGetProvider,
        });

        expect(result).toEqual(toResult(`Pool for pair (${props.tokenA}, ${props.tokenB}) not found`, true));
    });

    it('should return an error if getPoolState() fails', async () => {
        const mockGetProvider = createMockGetProvider({
            multicall: jest.fn((multicallProps: any) => {
                throw new Error('Invalid multicall');
            }),
        });

        const result = await mint(props, {
            notify: mockNotify,
            sendTransactions: jest.fn(),
            getProvider: mockGetProvider,
        });

        expect(result).toEqual(toResult(`Invalid pool (${pool}), failed to read pool data`, true));
    });

    it('should return an error if decimals() fails', async () => {
        const mockGetProvider = createMockGetProvider({
            readContract: jest.fn((readContractProps: any) => {
                switch (readContractProps.functionName) {
                    case 'decimals':
                        throw new Error(`Invalid token ${readContractProps.address}`);
                    case 'poolByPair':
                        return Promise.resolve(pool);
                    case 'tickSpacing':
                        return Promise.resolve(1);
                    default:
                        throw new Error('Invalid function');
                }
            }),
        });

        const result = await mint(
            { ...props, amountA: '0' },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockGetProvider,
            },
        );

        expect(result).toEqual(toResult(`Invalid ERC20 token contract at address ${props.tokenA}. Failed to fetch token details`, true));
    });

    it('should return an error if lowerPrice < upperPrice', async () => {
        const result = await mint(
            { ...props, lowerPrice: upperPrice, upperPrice: lowerPrice },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: createMockGetProvider(),
            },
        );

        expect(result).toEqual(toResult(`Lower price should be less than upper price.`, true));
    });

    it('should return error if amountA is 0', async () => {
        const result = await mint(
            { ...props, amountA: '0' },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: createMockGetProvider(),
            },
        );

        expect(result).toEqual(toResult('Amount A must be greater than 0', true));
    });

    it('should return error if amountB is 0', async () => {
        const result = await mint(
            { ...props, amountB: '0' },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: createMockGetProvider(),
            },
        );

        expect(result).toEqual(toResult('Amount B must be greater than 0', true));
    });

    it('should return an error if slippage is decimal', async () => {
        let slippage = 10.01;
        const result = await mint({ ...props, slippage: slippage }, {
            notify: mockNotify,
            sendTransactions: jest.fn(),
            getProvider: jest.fn(),
        });
        expect(result).toEqual(toResult('Invalid slippage tolerance: 10.01, please provide a whole non-negative number, max 3% got 0.1001 %', true));
    });

    it('should return an error if slippage is negative', async () => {
        let slippage = -10;
        const result = await mint({ ...props, slippage: slippage }, {
            notify: mockNotify,
            sendTransactions: jest.fn(),
            getProvider: jest.fn(),
        });
        expect(result).toEqual(toResult('Invalid slippage tolerance: -10, please provide a whole non-negative number, max 3% got -0.1 %', true));
    });

    it('should return an error if slippage is decimal', async () => {
        let slippage = 10.01;
        const result = await mint({ ...props, slippage: slippage }, {
            notify: mockNotify,
            sendTransactions: jest.fn(),
            getProvider: jest.fn(),
        });
        expect(result).toEqual(toResult('Invalid slippage tolerance: 10.01, please provide a whole non-negative number, max 3% got 0.1001 %', true));
    });

    it('should return an error if slippage is above threshold', async () => {
        let slippage = 500;
        const result = await mint({ ...props, slippage: slippage }, {
            notify: mockNotify,
            sendTransactions: jest.fn(),
            getProvider: jest.fn(),
        });
        expect(result).toEqual(toResult('Invalid slippage tolerance: 500, please provide a whole non-negative number, max 3% got 5 %', true));
    });

    //
    // it('should return an error if the amountAMin is 0', async () => {
    //     const result = await mint({...props, amountAMin: '0'}, functionOptions);
    //     expect(result).toEqual(toResult('Amount A MIN must be greater than 0', true));
    // });
    //
    // it('should return an error if the amountBMin is 0', async () => {
    //     const result = await mint({...props, amountBMin: '0'}, functionOptions);
    //     expect(result).toEqual(toResult('Amount B MIN must be greater than 0', true));
    // });
    //
});
