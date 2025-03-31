import { increaseLiquidity } from '../functions';
import { Address } from 'viem';
import { ChainId, SendTransactionProps, toResult, TransactionReturn } from '@heyanon/sdk';
import { TransactionParams } from '@heyanon/sdk/dist/blockchain/types';
import { ADDRESSES } from '../constants';
import { queryLPPositions } from '../functions/getLPPositions';

// Test data taken from: https://arbiscan.io/tx/0xbd47bbb0464a8a9ac54da8e5a72389226908229a08b33c9301592e44a94586fc
const chainId = ChainId.ARBITRUM;
const account = '0x9e47FBb2a2A27B3b02E4a63b3eF5A3dC863c0223' as Address;
const tokenId = 223965n;
const pool = '0x293dfd996d5cd72bed712b0eeab96dbe400c0416' as Address;
const tokenA = '0x35751007a407ca6FEFfE80b3cB397736D2cf4dbe' as Address;
const tokenB = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as Address;
const tokenADecimals = 18;
const tokenBDecimals = 18;
const deadline = 1738389388;

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
                        return Promise.resolve('weETH');
                    case tokenB:
                        return Promise.resolve('WETH');
                    default:
                        throw new Error(`Invalid token ${readContractProps.address}`);
                }
            case 'positions':
                const nonce = 0n;
                const operator = '0x0000000000000000000000000000000000000000';
                const token0 = '0x35751007a407ca6FEFfE80b3cB397736D2cf4dbe';
                const token1 = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1';
                const liquidity = '589983001442019276107172';
                const feeGrowthInside0LastX128 = '2375395507613789249999920488145';
                const feeGrowthInside1LastX128 = '2511051852204881784824549554011';
                const tokensOwed0 = '295898528996718';
                const tokensOwed1 = '312799634385020';

                let tickLower;
                let tickUpper;
                if (readContractProps.args[0] == tokenId || readContractProps.args[0] == 100001n) {
                    tickLower = 555;
                    tickUpper = 557;
                }
                if (readContractProps.args[0] == 2n * tokenId || readContractProps.args[0] == -100001n) {
                    tickLower = -557;
                    tickUpper = -555;
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
                const currentTick = 550n;
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
                if (simulateContractProps.args[0].tokenId == 100001n || simulateContractProps.args[0].tokenId == -100001n) {
                    amount0 = 0n;
                    amount1 = 0n;
                }
                if (simulateContractProps.args[0].tokenId == tokenId) {
                    amount0 = 3312498266597809837n;
                    amount1 = 0n;
                }
                if (simulateContractProps.args[0].tokenId == 2n * tokenId) {
                    amount0 = 0n;
                    amount1 = 6687501733402190163n;
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
                    topics: ['0x8a82de7fe9b33e0e6bca0e26f5bd14a74f1164ffe236d50e0a36c3ea70f2b814', '0x0000000000000000000000000000000000000000000000000000000000036add'],
                    data: '0x0000000000000000000000000000000000000000000007366b73e073768b222a0000000000000000000000000000000000000000000007366b73e073768b222a0000000000000000000000000000000000000000000000002df85b9f83a8dead0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000293dfd996d5cd72bed712b0eeab96dbe400c0416',
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

describe('increaseLiquidity Single Sided ABOVE', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        jest.spyOn(Date, 'now').mockImplementation(() => (deadline - 5 * 60) * 1000);
    });

    const props = {
        chainName: 'arbitrum-one',
        account: account,
        tokenA: tokenA,
        tokenB: tokenB,
        amountA: '3.312498266597809837',
        amountB: '0',
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
            '0xac9650d800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c4219f5d170000000000000000000000000000000000000000000000000000000000036add0000000000000000000000000000000000000000000000002df85b9f83a8dead00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002df601154b28e323000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000679db78c00000000000000000000000000000000000000000000000000000000',
        );
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
});

describe('increaseLiquidity Single Sided BELOW', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        jest.spyOn(Date, 'now').mockImplementation(() => (deadline - 5 * 60) * 1000);
    });

    const props = {
        chainName: 'arbitrum-one',
        account: account,
        tokenA: tokenA,
        tokenB: tokenB,
        amountA: '0',
        amountB: '6.6875017334',
        tokenId: Number(2n * tokenId), // Artificial ID
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
            '0xac9650d800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c4219f5d17000000000000000000000000000000000000000000000000000000000006d5ba00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005ccec765061db60000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005cca06f1f5321cdc00000000000000000000000000000000000000000000000000000000679db78c00000000000000000000000000000000000000000000000000000000',
        );
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

    it('should return error if amountBMin is 0', async () => {
        const mockPositions = [{ id: `-100001`, token0: { id: tokenA }, token1: { id: tokenB }, liquidity: '-1' }];
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
});
