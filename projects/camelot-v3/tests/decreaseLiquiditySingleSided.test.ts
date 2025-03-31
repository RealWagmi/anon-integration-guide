import { decreaseLiquidity } from '../functions';
import { Address } from 'viem';
import { ChainId, SendTransactionProps, toResult, TransactionReturn } from '@heyanon/sdk';
import { TransactionParams } from '@heyanon/sdk/dist/blockchain/types';
import { ADDRESSES, PERCENTAGE_BASE } from '../constants';
import { queryLPPositions } from '../functions/getLPPositions';

// Test data taken from: https://arbiscan.io/tx/0x11ec956b971a43714a5dd90568d8171c44ea7c87672763bdd6fdec47a3e14493
const chainId = ChainId.ARBITRUM;
const account = '0x78e709c05E4CDCBbd7c9fbA899960452f9b83966' as Address;
const pool = '0xc86Eb7B85807020b4548EE05B54bfC956eEbbfCD' as Address;
const tokenId = 223898n;
const tokenA = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as Address; // USDC
const tokenB = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8' as Address; // USDC.e
const tokenADecimals = 6;
const tokenBDecimals = 6;
const deadline = 1738401280;
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
                        return Promise.resolve('USDC.e');
                    default:
                        throw new Error(`Invalid token ${readContractProps.address}`);
                }
            case 'positions':
                const nonce = 0n;
                const operator = '0x0000000000000000000000000000000000000000';
                const token0 = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
                const token1 = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8';
                const liquidity = ((25009798932636n * PERCENTAGE_BASE) / BigInt(decreasePercentage)).toString();
                const feeGrowthInside0LastX128 = '0';
                const feeGrowthInside1LastX128 = '0';
                const tokensOwed0 = '0';
                const tokensOwed1 = '0';

                let tickLower;
                let tickUpper;
                if (readContractProps.args[0] == tokenId || readContractProps.args[0] == 100001n) {
                    tickLower = -5;
                    tickUpper = -1;
                }
                if (readContractProps.args[0] == 2n * tokenId || readContractProps.args[0] == -100001n) {
                    tickLower = 1;
                    tickUpper = 5;
                }

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
                const currentTick = 0n;
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
                if (simulateContractProps.args[0].tokenId == 100001n || simulateContractProps.args[0].tokenId == -100001n) {
                    amount0 = 0n;
                    amount1 = 0n;
                }
                if (simulateContractProps.args[0].tokenId == tokenId) {
                    amount0 = 0n;
                    amount1 = 5000959550n;
                }
                if (simulateContractProps.args[0].tokenId == 2n * tokenId) {
                    amount0 = 12355000959550n;
                    amount1 = 0n;
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
                    topics: ['0x26f6a048ee9138f2c0ce266f322cb99228e8d619ae2bff30c67f8dcf9d2377b4', '0x0000000000000000000000000000000000000000000000000000000000036a9a'],
                    data: '0x000000000000000000000000000000000000000000000000000016bf0c2e689c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012a14963e',
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

describe('decreaseLiquidity Single Sided ABOVE', () => {
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
        tokenId: 223898,
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

        expect(capturedTransactions).toHaveLength(1);
        expect(capturedTransactions[0].target).toEqual(ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS);
        expect(capturedTransactions[0].data).toEqual(
            '0xac9650d800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a40c49ccbe000000000000000000000000000000000000000000000000000000000006d534000000000000000000000000000000000000000000000000000016bf0c2e689c00000000000000000000000000000000000000000000000000000b3c0c2909be000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000679de60000000000000000000000000000000000000000000000000000000000',
        );
    });

    it('should return error if amountAMin is 0', async () => {
        const mockPositions = [{ id: `-100001`, token0: { id: tokenA }, token1: { id: tokenB }, liquidity: '-1' }];
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
});

describe('decreaseLiquidity Single Sided BELOW', () => {
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

        expect(capturedTransactions).toHaveLength(1);
        expect(capturedTransactions[0].target).toEqual(ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS);
        expect(capturedTransactions[0].data).toEqual(
            '0xac9650d800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000a40c49ccbe0000000000000000000000000000000000000000000000000000000000036a9a000000000000000000000000000000000000000000000000000016bf0c2e689c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012a05533e00000000000000000000000000000000000000000000000000000000679de60000000000000000000000000000000000000000000000000000000000',
        );
    });

    it('should return error if amountBMin is 0', async () => {
        const mockPositions = [{ id: `100001`, token0: { id: tokenA }, token1: { id: tokenB }, liquidity: '-1' }];
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
});
