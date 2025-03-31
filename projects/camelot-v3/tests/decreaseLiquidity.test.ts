import { decreaseLiquidity } from '../functions';
import { Address, decodeFunctionData } from 'viem';
import { ChainId, SendTransactionProps, toResult, TransactionReturn } from '@heyanon/sdk';
import { TransactionParams } from '@heyanon/sdk/dist/blockchain/types';
import { ADDRESSES, PERCENTAGE_BASE } from '../constants';
import { queryLPPositions } from '../functions/getLPPositions';
import { nonFungiblePositionManagerAbi } from '../abis';

// Test data taken from: https://arbiscan.io/tx/0x522c3170d075e54e576cce546292969318cc46f3df5a94651dfea54961013c52
const chainId = ChainId.ARBITRUM;
const account = '0x4f545Eac62b68765D84A19D6A6e532B21C536d20' as Address;
const pool = '0xa17aFCAb059F3C6751F5B64347b5a503C3291868' as Address;
const tokenId = 221117n;
const tokenA = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as Address; // USDC
const tokenB = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' as Address; // USDT
const tokenADecimals = 6;
const tokenBDecimals = 6;
const deadline = 1738400417;
const decreasePercentage = 10;

jest.mock('../functions/getLPPositions');

const mockNotify = jest.fn((message: string) => {
    console.log(message);
    return Promise.resolve();
});

const mockProvider = jest.fn().mockReturnValue({
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
                        return Promise.resolve('USDC');
                    case tokenB:
                        return Promise.resolve('USDT');
                    default:
                        throw new Error(`Invalid token ${readContractProps.address}`);
                }
            case 'positions':
                if (readContractProps.args[0] < 100000n) {
                    throw new Error('Invalid tokenId');
                }

                const nonce = 0n;
                const operator = '0x0000000000000000000000000000000000000000';
                const token0 = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
                const token1 = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9';
                const tickLower = -5;
                const tickUpper = 8;
                const liquidity = ((3353274044023n * PERCENTAGE_BASE) / BigInt(decreasePercentage)).toString();
                const feeGrowthInside0LastX128 = '0';
                const feeGrowthInside1LastX128 = '0';
                const tokensOwed0 = '0';
                const tokensOwed1 = '0';

                return Promise.resolve([
                    nonce,
                    operator,
                    token0,
                    token1,
                    tickLower,
                    tickUpper,
                    liquidity,
                    feeGrowthInside0LastX128,
                    feeGrowthInside1LastX128,
                    tokensOwed0,
                    tokensOwed1,
                ]);
            case 'poolByPair':
                return Promise.resolve(pool);
            case 'globalState':
                const currentTick = 4n;
                return Promise.resolve([-1n, currentTick]);
            default:
                throw new Error(`Invalid function ${readContractProps.functionName}`);
        }
    }),
    simulateContract: jest.fn((simulateContractProps: any) => {
        switch (simulateContractProps.functionName) {
            case 'decreaseLiquidity':
                let amount0;
                let amount1;
                if (simulateContractProps.args[0].tokenId === 100001n) {
                    amount0 = 0n;
                    amount1 = 0n;
                }
                if (simulateContractProps.args[0].tokenId === 100002n) {
                    amount0 = 10n ** 18n;
                    amount1 = 0n;
                }
                if (simulateContractProps.args[0].tokenId == tokenId) {
                    amount0 = 506061013n;
                    amount1 = 1662395072n;
                }

                return Promise.resolve({
                    result: [amount0, amount1],
                });
            default:
                throw new Error(`Invalid function ${simulateContractProps.functionName}`);
        }
    }),
    getTransactionReceipt: jest.fn(() => {
        return Promise.resolve({
            logs: [
                {
                    address: '0x00c7f3082833e796A5b3e4Bd59f6642FF44DCD15',
                    topics: ['0x26f6a048ee9138f2c0ce266f322cb99228e8d619ae2bff30c67f8dcf9d2377b4', '0x0000000000000000000000000000000000000000000000000000000000035fbd'],
                    data: '0x0000000000000000000000000000000000000000000000000000030cbeb54e77000000000000000000000000000000000000000000000000000000001e50ae820000000000000000000000000000000000000000000000000000000063959a91',
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
});

describe('decreaseLiquidity', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        jest.spyOn(Date, 'now').mockImplementation(() => (deadline - 5 * 60) * 1000);
    });

    const props = {
        chainName: 'arbitrum-one',
        account: account,
        tokenA: tokenA,
        tokenB: tokenB,
        decreasePercentage: decreasePercentage,
        tokenId: Number(tokenId),
        amountAMin: '0',
        amountBMin: '0',
    };

    it('should prepare and send transactions correctly', async () => {
        let capturedTransactions: TransactionParams[] = [];
        const mockSendTransactions = jest.fn((props: SendTransactionProps): Promise<TransactionReturn> => {
            capturedTransactions = props.transactions;
            return Promise.resolve({
                isMultisig: false,
                data: [{ message: 'Transaction successful', hash: '0x' }],
            });
        });

        const result = await decreaseLiquidity(props, {
            notify: mockNotify,
            sendTransactions: mockSendTransactions,
            getProvider: mockProvider,
        });

        expect(result.success).toEqual(true);
        expect(result.data).toContain('success');

        const decodedMulticall = decodeFunctionData({
            abi: nonFungiblePositionManagerAbi,
            data: capturedTransactions[0].data,
        });
        const decodedCall = decodeFunctionData({
            abi: nonFungiblePositionManagerAbi,
            data: (decodedMulticall.args[0] as any)[0],
        });

        expect(capturedTransactions).toHaveLength(1);
        expect(capturedTransactions[0].target).toEqual(ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS);
        expect(capturedTransactions[0].data).toEqual(
            '0xac9650d800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a40c49ccbe0000000000000000000000000000000000000000000000000000000000035fbd0000000000000000000000000000000000000000000000000000030cbeb54e77000000000000000000000000000000000000000000000000000000001e285578000000000000000000000000000000000000000000000000000000006311100000000000000000000000000000000000000000000000000000000000679de2a100000000000000000000000000000000000000000000000000000000',
        );
    });

    it('should query positions if tokenId is not provided', async () => {
        let capturedTransactions: TransactionParams[] = [];
        const mockSendTransactions = jest.fn((props: SendTransactionProps): Promise<TransactionReturn> => {
            capturedTransactions = props.transactions;
            return Promise.resolve({
                isMultisig: false,
                data: [{ message: 'Transaction successful', hash: '0x' }],
            });
        });

        const mockPositions = [{ id: `${tokenId}`, token0: { id: tokenA }, token1: { id: tokenB }, liquidity: '-1' }];
        (queryLPPositions as jest.Mock).mockResolvedValue(mockPositions);

        const result = await decreaseLiquidity(
            { ...props, tokenId: undefined },
            {
                notify: mockNotify,
                sendTransactions: mockSendTransactions,
                getProvider: mockProvider,
            },
        );

        expect(result.success).toEqual(true);
        expect(result.data).toContain('success');

        expect(capturedTransactions).toHaveLength(1);
        expect(capturedTransactions[0].target).toEqual(ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS);
        expect(capturedTransactions[0].data).toEqual(
            '0xac9650d800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a40c49ccbe0000000000000000000000000000000000000000000000000000000000035fbd0000000000000000000000000000000000000000000000000000030cbeb54e77000000000000000000000000000000000000000000000000000000001e285578000000000000000000000000000000000000000000000000000000006311100000000000000000000000000000000000000000000000000000000000679de2a100000000000000000000000000000000000000000000000000000000',
        );
    });

    it('should return error if tokenId is not provided and user has multiple positions open', async () => {
        const mockPositions = [
            { id: `1`, token0: { id: tokenA }, token1: { id: tokenB }, liquidity: '-1' },
            { id: `2`, token0: { id: tokenA }, token1: { id: tokenB }, liquidity: '-1' },
        ];
        (queryLPPositions as jest.Mock).mockResolvedValue(mockPositions);

        const result = await decreaseLiquidity(
            { ...props, tokenId: undefined },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult('There are multiple LP positions, please provide a specific position ID to collect fees from', true));
    });

    it('should return error if tokenId is not provided and position is not found', async () => {
        const mockPositions = [{ id: `1`, token0: { id: tokenA }, token1: { id: tokenB }, liquidity: '-1' }];
        (queryLPPositions as jest.Mock).mockResolvedValue(mockPositions);

        const result = await decreaseLiquidity(
            { ...props, tokenId: undefined },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult('Position with ID 1 not found', true));
    });

    it('should return error if amountAMin is 0', async () => {
        const mockPositions = [{ id: `100001`, token0: { id: tokenA }, token1: { id: tokenB }, liquidity: '-1' }];
        (queryLPPositions as jest.Mock).mockResolvedValue(mockPositions);

        const result = await decreaseLiquidity(
            { ...props, tokenId: undefined, amountAMin: '0' },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult('Amount A MIN must be greater than 0', true));
    });

    it('should return error if amountBMin is 0', async () => {
        const mockPositions = [{ id: `100002`, token0: { id: tokenA }, token1: { id: tokenB }, liquidity: '-1' }];
        (queryLPPositions as jest.Mock).mockResolvedValue(mockPositions);

        const result = await decreaseLiquidity(
            { ...props, tokenId: undefined, amountBMin: '0' },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult('Amount B MIN must be greater than 0', true));
    });

    it('should return error if tokenId is decimal', async () => {
        const mockPositions = [{ id: `100000`, token0: { id: tokenA }, token1: { id: tokenB }, liquidity: '-1' }];
        (queryLPPositions as jest.Mock).mockResolvedValue(mockPositions);

        const result = await decreaseLiquidity(
            { ...props, tokenId: 100000.01 },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult('Invalid token ID: 100000.01, please provide a whole non-negative number', true));
    });

    it('should return error if tokenId is negative', async () => {
        const mockPositions = [{ id: `100000`, token0: { id: tokenA }, token1: { id: tokenB }, liquidity: '-1' }];
        (queryLPPositions as jest.Mock).mockResolvedValue(mockPositions);

        const result = await decreaseLiquidity(
            { ...props, tokenId: -100000 },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult('Invalid token ID: -100000, please provide a whole non-negative number', true));
    });

    it('should return error if decreasePercentage is decimal', async () => {
        let decreasePercentage = 10.01;
        const result = await decreaseLiquidity(
            { ...props, decreasePercentage: decreasePercentage },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult(`Invalid decrease percentage: ${decreasePercentage}, please provide a whole non-negative number in bps [0, 10000]`, true));
    });

    it('should return error if decreasePercentage is negative', async () => {
        let decreasePercentage = -10;
        const result = await decreaseLiquidity(
            { ...props, decreasePercentage: decreasePercentage },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult(`Invalid decrease percentage: ${decreasePercentage}, please provide a whole non-negative number in bps [0, 10000]`, true));
    });

    it('should return an error if slippage is decimal', async () => {
        let slippage = 10.01;
        const result = await decreaseLiquidity({ ...props, slippage: slippage }, {
            notify: mockNotify,
            sendTransactions: jest.fn(),
            getProvider: mockProvider,
        },);
        expect(result).toEqual(toResult('Invalid slippage tolerance: 10.01, please provide a whole non-negative number, max 3% got 0.1001 %', true));
    });

    it('should return an error if slippage is negative', async () => {
        let slippage = -10;
        const result = await decreaseLiquidity({ ...props, slippage: slippage }, {
            notify: mockNotify,
            sendTransactions: jest.fn(),
            getProvider: mockProvider,
        },);
        expect(result).toEqual(toResult('Invalid slippage tolerance: -10, please provide a whole non-negative number, max 3% got -0.1 %', true));
    });

    it('should return an error if slippage is decimal', async () => {
        let slippage = 10.01;
        const result = await decreaseLiquidity({ ...props, slippage: slippage }, {
            notify: mockNotify,
            sendTransactions: jest.fn(),
            getProvider: mockProvider,
        },);
        expect(result).toEqual(toResult('Invalid slippage tolerance: 10.01, please provide a whole non-negative number, max 3% got 0.1001 %', true));
    });

    it('should return an error if slippage is above threshold', async () => {
        let slippage = 500;
        const result = await decreaseLiquidity({ ...props, slippage: slippage }, {
            notify: mockNotify,
            sendTransactions: jest.fn(),
            getProvider: mockProvider,
        },);
        expect(result).toEqual(toResult('Invalid slippage tolerance: 500, please provide a whole non-negative number, max 3% got 5 %', true));
    });

    it('should return failed to receive tx message if transaction hash is not received', async () => {
        const mockSendTransactions = jest.fn((props: SendTransactionProps): Promise<TransactionReturn> => {
            return Promise.resolve({
                isMultisig: false,
                data: [{ message: 'Transaction successful' }],
            }) as Promise<any>;
        });

        const result = await decreaseLiquidity(props, {
            notify: mockNotify,
            sendTransactions: mockSendTransactions,
            getProvider: mockProvider,
        });

        expect(result).toEqual(toResult(`Tried to decrease liquidity on Camelot V3, but failed to receive tx hash. Transaction successful`, false));
    });
});
