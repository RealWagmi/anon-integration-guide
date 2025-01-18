import { collect } from '../functions';
import { Address } from 'viem';
import { ChainId, SendTransactionProps, toResult, TransactionReturn } from '@heyanon/sdk';
import { TransactionParams } from '@heyanon/sdk/dist/blockchain/types';
import { ADDRESSES, PERCENTAGE_BASE } from '../constants';
import { queryLPPositions } from '../functions/getLPPositions';

// Test data taken from: https://arbiscan.io/tx/0x145e7492ff248c9928b44151a959bffab40ca9046384910412483ad66629e30d
const chainId = ChainId.ARBITRUM;
const account = '0xc06CaeDBBb5D3C8E71a210cbe9bfA13cf73e0d5f' as Address;
const pool = '0xc23f308CF1bFA7efFFB592920a619F00990F8D74' as Address;
const tokenId = 223602n;
const tokenA = '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34' as Address; // USDe
const tokenB = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as Address; // USDC
const tokenADecimals = 18;
const tokenBDecimals = 6;
const deadline = 1738399977;
const collectPercentage = 10;

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
            case 'positions':
                if (readContractProps.args[0] < 100000n) {
                    throw new Error('Invalid tokenId');
                }

                const nonce = 0n;
                const operator = '0x0000000000000000000000000000000000000000';
                const token0 = '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34';
                const token1 = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
                const tickLower = -1;
                const tickUpper = -1;
                const liquidity = '0';
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
            default:
                throw new Error(`Invalid function ${readContractProps.functionName}`);
        }
    }),
    simulateContract: jest.fn((simulateContractProps: any) => {
        switch (simulateContractProps.functionName) {
            case 'collect':
                let amount0;
                let amount1;
                if (simulateContractProps.args[0].tokenId === 100001n) {
                    amount0 = 0n;
                    amount1 = 0n;
                }
                if (simulateContractProps.args[0].tokenId == tokenId) {
                    amount0 = (238360482534311640541212n * PERCENTAGE_BASE) / BigInt(collectPercentage);
                    amount1 = (52080430n * PERCENTAGE_BASE) / BigInt(collectPercentage);
                }

                return Promise.resolve({
                    result: [amount0, amount1],
                });
            default:
                throw new Error(`Invalid function ${simulateContractProps.functionName}`);
        }
    }),
});

describe('collect', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        jest.spyOn(Date, 'now').mockImplementation(() => (deadline - 5 * 60) * 1000);
    });

    const props = {
        chainName: 'arbitrum-one',
        account: account,
        tokenA: tokenA,
        tokenB: tokenB,
        tokenId: Number(tokenId),
        collectPercentage: collectPercentage,
        amount0Max: '0',
        amount1Max: '0',
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

        const result = await collect(props, {
            notify: mockNotify,
            sendTransactions: mockSendTransactions,
            getProvider: mockProvider,
        });

        expect(result.success).toEqual(true);
        expect(result.data).toContain('success');

        expect(capturedTransactions).toHaveLength(1);
        expect(capturedTransactions[0].target).toEqual(ADDRESSES[chainId].NONFUNGIBLE_POSITION_MANAGER_ADDRESS);
        expect(capturedTransactions[0].data).toEqual(
            '0xfc6f78650000000000000000000000000000000000000000000000000000000000036972000000000000000000000000c06caedbbb5d3c8e71a210cbe9bfa13cf73e0d5f0000000000000000000000000000000000000000000032798c32c8febaa5a81c00000000000000000000000000000000000000000000000000000000031aaf2e',
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

        const result = await collect(
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
            '0xfc6f78650000000000000000000000000000000000000000000000000000000000036972000000000000000000000000c06caedbbb5d3c8e71a210cbe9bfa13cf73e0d5f0000000000000000000000000000000000000000000032798c32c8febaa5a81c00000000000000000000000000000000000000000000000000000000031aaf2e',
        );
    });

    it('should use amount MAX values when provided', async () => {
        let capturedTransactions: TransactionParams[] = [];
        const mockSendTransactions = jest.fn((props: SendTransactionProps): Promise<TransactionReturn> => {
            capturedTransactions = props.transactions;
            return Promise.resolve({
                isMultisig: false,
                data: [{ message: 'Transaction successful', hash: '0x' }],
            });
        });

        const amountAMax = '92.3';
        const amountBMax = '0.2';
        const result = await collect(
            { ...props, collectPercentage: undefined, amountAMax: amountAMax, amountBMax: amountBMax },
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
            '0xfc6f78650000000000000000000000000000000000000000000000000000000000036972000000000000000000000000c06caedbbb5d3c8e71a210cbe9bfa13cf73e0d5f00000000000000000000000000000000000000000000000500eb78f9408e00000000000000000000000000000000000000000000000000000000000000030d40',
        );
    });

    it('should return error if tokenId is not provided and user has multiple positions open', async () => {
        const mockPositions = [
            { id: `1`, token0: { id: tokenA }, token1: { id: tokenB }, liquidity: '-1' },
            { id: `2`, token0: { id: tokenA }, token1: { id: tokenB }, liquidity: '-1' },
        ];
        (queryLPPositions as jest.Mock).mockResolvedValue(mockPositions);

        const result = await collect(
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

        const result = await collect(
            { ...props, tokenId: undefined },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult('Position with ID 1 not found', true));
    });

    it('should return error if both amountAMax and amountBMax are 0', async () => {
        const result = await collect(
            { ...props, collectPercentage: undefined, amountAMax: '0', amountBMax: '0' },
            {
                notify: mockNotify,
                sendTransactions: jest.fn(),
                getProvider: mockProvider,
            },
        );

        expect(result).toEqual(toResult('Nothing to collect, since both amounts are 0', true));
    });
});
