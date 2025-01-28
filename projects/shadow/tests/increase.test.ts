import { afterEach, describe, expect, it, vi } from 'vitest';
import { zeroAddress, type Address } from 'viem';
import { Props as IncreaseProps } from '../functions/increaseLiquidity.js';
import { ChainId, SendTransactionProps, TransactionReturn } from '@heyanon/sdk';
import { WRAPPED_NATIVE_ADDRESS } from '../constants.js';
import { Token } from '@uniswap/sdk-core';
import { ShadowSDK } from '../sdk.js';
import { FeeAmount, Pool, Position } from '@kingdomdotone/v3-sdk';
import { increaseLiquidity } from '../functions/increaseLiquidity.js';

const MockShadowSDK = vi.fn();
MockShadowSDK.prototype.getToken = vi.fn();
MockShadowSDK.prototype.getPool = vi.fn();

const USDC_ADDRESS: Address = '0x29219dd400f2Bf60E5a23d13Be72B486D4038894';

const WRAPPED_NATIVE_TOKEN = new Token(
    ChainId.SONIC,
    WRAPPED_NATIVE_ADDRESS,
    18,
    'wS',
    'Wrapped Sonic',
);
const USDC_TOKEN = new Token(ChainId.SONIC, USDC_ADDRESS, 6, 'USDC', 'USD Coin');

const WS_USDC_POOL = new Pool(
    WRAPPED_NATIVE_TOKEN,
    USDC_TOKEN,
    2806 as FeeAmount,
    '62087202701351025686530', // price is 0.614108373861043724
    '3034834343150686783',
    -281201,
    [],
    50,
);

const WS_USDC_POSITION_1 = Position.fromAmounts({
    pool: WS_USDC_POOL,
    tickLower: -282850,
    tickUpper: -279800,
    amount0: '1000',
    amount1: '614',
    useFullPrecision: true,
});

const WS_USDC_POSITION_2 = Position.fromAmounts({
    pool: WS_USDC_POOL,
    tickLower: -282800,
    tickUpper: -279850,
    amount0: '1000',
    amount1: '614',
    useFullPrecision: true,
});

const mockNotify = vi.fn((message: string) => {
    console.log(message);
    return Promise.resolve();
});

const mockSendTransactions = vi.fn(
    (props: SendTransactionProps): Promise<TransactionReturn> => {
        return Promise.resolve({
            isMultisig: false,
            data: [{ message: 'Transaction successful', hash: '0x' }],
        });
    },
);

describe('Minting', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    const props: IncreaseProps = {
        chainName: 'sonic',
        account: zeroAddress,
        tokenA: WRAPPED_NATIVE_ADDRESS,
        tokenB: USDC_ADDRESS,
        amountA: '10.5',
        amountB: '7.5',
    };

    it('it should add liquidity to an existing position with a range of +-15%', async () => {
        const sdk: ShadowSDK = new MockShadowSDK();

        vi.mocked(sdk.getToken).mockReturnValueOnce(
            Promise.resolve(WRAPPED_NATIVE_TOKEN),
        );
        vi.mocked(sdk.getToken).mockReturnValueOnce(Promise.resolve(USDC_TOKEN));
        vi.mocked(sdk.getPool).mockReturnValueOnce(Promise.resolve(WS_USDC_POOL));
        vi.spyOn(ShadowSDK, 'getLpPositions').mockReturnValueOnce(
            Promise.resolve([
                {
                    position: WS_USDC_POSITION_1,
                    poolSymbol: 'wS/USDC',
                    tokenId: 42,
                },
            ]),
        );

        const { position } = await increaseLiquidity(props, sdk, mockNotify);

        expect(position.tickLower).toEqual(WS_USDC_POSITION_1.tickLower);
        expect(position.tickUpper).toEqual(WS_USDC_POSITION_1.tickUpper);
        expect(position.amount0.toExact()).toEqual('10.427978627154949737');
        expect(position.amount1.toExact()).toEqual('7.499999');
    });

    it('it should add liquidity to the position from the specified token ID', async () => {
        const sdk: ShadowSDK = new MockShadowSDK();

        vi.mocked(sdk.getToken).mockReturnValueOnce(
            Promise.resolve(WRAPPED_NATIVE_TOKEN),
        );
        vi.mocked(sdk.getToken).mockReturnValueOnce(Promise.resolve(USDC_TOKEN));
        vi.mocked(sdk.getPool).mockReturnValueOnce(Promise.resolve(WS_USDC_POOL));
        vi.spyOn(ShadowSDK, 'getLpPositions').mockReturnValueOnce(
            Promise.resolve([
                {
                    position: WS_USDC_POSITION_1,
                    poolSymbol: 'wS/USDC',
                    tokenId: 42,
                },
                {
                    position: WS_USDC_POSITION_2,
                    poolSymbol: 'wS/USDC',
                    tokenId: 100,
                },
            ]),
        );

        const { position } = await increaseLiquidity(
            { ...props, tokenId: 100 },
            sdk,
            mockNotify,
        );

        expect(position.tickLower).toEqual(WS_USDC_POSITION_2.tickLower);
        expect(position.tickUpper).toEqual(WS_USDC_POSITION_2.tickUpper);
    });

    it('it should throw an error if no positions are found', async () => {
        const sdk: ShadowSDK = new MockShadowSDK();

        vi.mocked(sdk.getToken).mockReturnValueOnce(
            Promise.resolve(WRAPPED_NATIVE_TOKEN),
        );
        vi.mocked(sdk.getToken).mockReturnValueOnce(Promise.resolve(USDC_TOKEN));
        vi.mocked(sdk.getPool).mockReturnValueOnce(Promise.resolve(WS_USDC_POOL));
        vi.spyOn(ShadowSDK, 'getLpPositions').mockReturnValueOnce(
            Promise.resolve([
                {
                    position: WS_USDC_POSITION_1,
                    poolSymbol: 'wS/USDC',
                    tokenId: 42,
                },
            ]),
        );

        await expect(
            increaseLiquidity({ ...props, tokenId: 66 }, sdk, mockNotify),
        ).rejects.toThrow('No position found with the specified ID');
    });
});
