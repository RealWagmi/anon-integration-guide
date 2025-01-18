import { decreaseLiquidity } from '../functions';
import { Address } from 'viem';
import { ChainId, SendTransactionProps, TransactionReturn } from '@heyanon/sdk';
import { TransactionParams } from '@heyanon/sdk/dist/blockchain/types';
import { ADDRESSES, PERCENTAGE_BASE } from '../constants';

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
const decreasePercentage = 100;

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
                const tickLower = -276328;
                const tickUpper = -276317;
                const liquidity = ((217745001017074966791n * PERCENTAGE_BASE) / BigInt(decreasePercentage)).toString();
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
                const currentTick = -276337;
                return Promise.resolve([-1n, currentTick]);
            default:
                throw new Error('Invalid function');
        }
    }),
    simulateContract: jest.fn((simulateContractProps: any) => {
        switch (simulateContractProps.functionName) {
            case 'decreaseLiquidity':
                let amount0;
                let amount1;
                if (simulateContractProps.args[0].tokenId == tokenId) {
                    amount0 = 119145902314377225600454n;
                    amount1 = 0n;
                }

                return Promise.resolve({
                    result: [amount0, amount1],
                });
            case 'collect':
                const amount0Max = 119778964394363746027393n;
                const amount1Max = 26040215n;

                return Promise.resolve({
                    result: [amount0Max, amount1Max],
                });
            default:
                throw new Error(`Invalid function ${simulateContractProps.functionName}`);
        }
    }),
});

describe('decreaseLiquidity, collect and burn', () => {
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
            '0xac9650d80000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000a40c49ccbe000000000000000000000000000000000000000000000000000000000003697200000000000000000000000000000000000000000000000bcdd1a4c337d2e1070000000000000000000000000000000000000000000019399edaab809be7f645000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000679de0e9000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084fc6f78650000000000000000000000000000000000000000000000000000000000036972000000000000000000000000c06caedbbb5d3c8e71a210cbe9bfa13cf73e0d5f00000000000000000000000000000000000000000000195d3b0d3c85a4c0878100000000000000000000000000000000000000000000000000000000018d579700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002442966c68000000000000000000000000000000000000000000000000000000000003697200000000000000000000000000000000000000000000000000000000',
        );
    });
});
