import { collect, exactInputSingle, increaseLiquidity } from '../functions';
import { Address } from 'viem';
import { ChainId, SendTransactionProps, toResult, TransactionReturn } from '@heyanon/sdk';
import { TransactionParams } from '@heyanon/sdk/dist/blockchain/types';
import { ADDRESSES } from '../constants';
import { queryLPPositions } from '../functions/getLPPositions';

// Test data taken from: https://arbiscan.io/tx/0xd5a45ebf7e5104b8eea93eb0698e934c82c1cb0441154e7013bca28b9e5d5c61
const chainId = ChainId.ARBITRUM;
const account = '0x88af05758d2834a3A06Ccf65f28a25210d5eaD5E' as Address;
const pool = '0xa17aFCAb059F3C6751F5B64347b5a503C3291868' as Address;
const tokenId = 224013n;
const tokenA = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as Address; // USDC
const tokenB = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' as Address; // USDT
const tokenADecimals = 6;
const tokenBDecimals = 6;
const deadline = 1738397137;

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
                const tickLower = 3;
                const tickUpper = 6;
                const liquidity = '533615414141289';
                const feeGrowthInside0LastX128 = '1344498118854185446034780858302742';
                const feeGrowthInside1LastX128 = '1335669014047967467069261652700432';
                const tokensOwed0 = '5523';
                const tokensOwed1 = '58214';

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
            case 'increaseLiquidity':
                const liquidity = -1n;

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
                    amount0 = 409058501n;
                    amount1 = 253150759n;
                }

                return Promise.resolve({
                    result: [liquidity, amount0, amount1],
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
                    topics: ['0x8a82de7fe9b33e0e6bca0e26f5bd14a74f1164ffe236d50e0a36c3ea70f2b814', '0x0000000000000000000000000000000000000000000000000000000000036b0d'],
                    data: '0x000000000000000000000000000000000000000000000000000003ed3303760d000000000000000000000000000000000000000000000000000003ed3303760d00000000000000000000000000000000000000000000000000000000178167ad000000000000000000000000000000000000000000000000000000000f16c627000000000000000000000000a17afcab059f3c6751f5b64347b5a503c3291868',
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

describe('increaseLiquidity', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        jest.spyOn(Date, 'now').mockImplementation(() => (deadline - 5 * 60) * 1000);
    });

    const props = {
        chainName: 'arbitrum-one',
        account: account,
        tokenA: tokenA,
        tokenB: tokenB,
        amountA: '409.058501',
        amountB: '253.150759',
        tokenId: Number(tokenId),
        amountAMin: '0',
        amountBMin: '0',
        slippage: 250,
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

        const result = await increaseLiquidity(props, {
            notify: mockNotify,
            sendTransactions: mockSendTransactions,
            getProvider: mockProvider,
        });

        expect(result.success).toEqual(true);
        expect(result.data).toContain('success');

        expect(capturedTransactions).toHaveLength(1);
        expect(capturedTransactions[0].target).toEqual(ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS);
        expect(capturedTransactions[0].data).toEqual(
            '0xac9650d800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c4219f5d170000000000000000000000000000000000000000000000000000000000036b0d000000000000000000000000000000000000000000000000000000001861bcc5000000000000000000000000000000000000000000000000000000000f16c6270000000000000000000000000000000000000000000000000000000017c5b1a6000000000000000000000000000000000000000000000000000000000eb6346600000000000000000000000000000000000000000000000000000000679dd5d100000000000000000000000000000000000000000000000000000000',
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

        const result = await increaseLiquidity(
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
            '0xac9650d800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c4219f5d170000000000000000000000000000000000000000000000000000000000036b0d000000000000000000000000000000000000000000000000000000001861bcc5000000000000000000000000000000000000000000000000000000000f16c6270000000000000000000000000000000000000000000000000000000017c5b1a6000000000000000000000000000000000000000000000000000000000eb6346600000000000000000000000000000000000000000000000000000000679dd5d100000000000000000000000000000000000000000000000000000000',
        );
    });

    it('should return error if tokenId is not provided and user has multiple positions open', async () => {
        const mockPositions = [
            { id: `1`, token0: { id: tokenA }, token1: { id: tokenB }, liquidity: '-1' },
            { id: `2`, token0: { id: tokenA }, token1: { id: tokenB }, liquidity: '-1' },
        ];
        (queryLPPositions as jest.Mock).mockResolvedValue(mockPositions);

        const result = await increaseLiquidity(
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

        const result = await increaseLiquidity(
            { ...props, tokenId: undefined },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult('Position with ID 1 not found', true));
    });

    it('should return error if amountA is 0', async () => {
        const result = await increaseLiquidity(
            { ...props, amountA: '0' },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult('Amount A must be greater than 0', true));
    });

    it('should return error if amountB is 0', async () => {
        const result = await increaseLiquidity(
            { ...props, amountB: '0' },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult('Amount B must be greater than 0', true));
    });

    it('should return error if amountAMin is 0', async () => {
        const mockPositions = [{ id: `100001`, token0: { id: tokenA }, token1: { id: tokenB }, liquidity: '-1' }];
        (queryLPPositions as jest.Mock).mockResolvedValue(mockPositions);

        const result = await increaseLiquidity(
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

        const result = await increaseLiquidity(
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
        let tokenId = 1.1
        const result = await increaseLiquidity(
            { ...props, tokenId: tokenId },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult(`Invalid token ID: ${tokenId}, please provide a whole non-negative number`, true));
    });

    it('should return error if tokenId is negative', async () => {
        let tokenId = -1;
        const result = await increaseLiquidity(
            { ...props, tokenId: -1 },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult(`Invalid token ID: ${tokenId}, please provide a whole non-negative number`, true));
    });

    it('should return an error if slippage is decimal', async () => {
        let slippage = 10.01;
        const result = await increaseLiquidity({ ...props, slippage: slippage }, {
            notify: mockNotify,
            sendTransactions: jest.fn(),
            getProvider: mockProvider,
        },);
        expect(result).toEqual(toResult('Invalid slippage tolerance: 10.01, please provide a whole non-negative number, max 3% got 0.1001 %', true));
    });

    it('should return an error if slippage is negative', async () => {
        let slippage = -10;
        const result = await increaseLiquidity({ ...props, slippage: slippage }, {
            notify: mockNotify,
            sendTransactions: jest.fn(),
            getProvider: mockProvider,
        },);
        expect(result).toEqual(toResult('Invalid slippage tolerance: -10, please provide a whole non-negative number, max 3% got -0.1 %', true));
    });

    it('should return an error if slippage is decimal', async () => {
        let slippage = 10.01;
        const result = await increaseLiquidity({ ...props, slippage: slippage }, {
            notify: mockNotify,
            sendTransactions: jest.fn(),
            getProvider: mockProvider,
        },);
        expect(result).toEqual(toResult('Invalid slippage tolerance: 10.01, please provide a whole non-negative number, max 3% got 0.1001 %', true));
    });

    it('should return an error if slippage is above threshold', async () => {
        let slippage = 500;
        const result = await increaseLiquidity({ ...props, slippage: slippage }, {
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

        const result = await increaseLiquidity(props, {
            notify: mockNotify,
            sendTransactions: mockSendTransactions,
            getProvider: mockProvider,
        });

        expect(result).toEqual(toResult(`Tried to increase liquidity on Camelot V3, but failed to receive tx hash. Transaction successful`, false));
    });
});
