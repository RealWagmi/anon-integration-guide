import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPublicClient, http, zeroAddress, type Address } from 'viem';
import { sonic } from 'viem/chains';
import { mint, Props as MintProps } from '../functions/mint.js';
import { ChainId, SendTransactionProps, TransactionReturn } from '@heyanon/sdk';
import { WRAPPED_NATIVE_ADDRESS } from '../constants.js';
import { Token } from '@uniswap/sdk-core';
import { ShadowSDK } from '../sdk.js';
import { FeeAmount, Pool } from '@kingdomdotone/v3-sdk';

const MockShadowSDK = vi.fn();
MockShadowSDK.prototype.getToken = vi.fn();
MockShadowSDK.prototype.getPool = vi.fn();

const publicClient = createPublicClient({ transport: http(), chain: sonic });

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

    const props: MintProps = {
        chainName: 'sonic',
        account: zeroAddress,
        tokenA: WRAPPED_NATIVE_ADDRESS,
        tokenB: USDC_ADDRESS,
        amountA: '10.5',
        amountB: '7.5',
        recipient: zeroAddress,
    };

    it('it should create a mint position using a default range of +-15%', async () => {
        const sdk: ShadowSDK = new MockShadowSDK();

        vi.mocked(sdk.getToken).mockReturnValueOnce(
            Promise.resolve(WRAPPED_NATIVE_TOKEN),
        );
        vi.mocked(sdk.getToken).mockReturnValueOnce(Promise.resolve(USDC_TOKEN));
        vi.mocked(sdk.getPool).mockReturnValueOnce(Promise.resolve(WS_USDC_POOL));

        const { position } = await mint(props, sdk, publicClient, mockNotify);

        expect(position.tickLower).toEqual(-282850);
        expect(position.tickUpper).toEqual(-279800);
        expect(position.amount0.toExact()).toEqual('10.427978627154949737');
        expect(position.amount1.toExact()).toEqual('7.499999');
    });

    it('it should create a mint position with a range defined by lowerPrice and upperPrice', async () => {
        const sdk: ShadowSDK = new MockShadowSDK();

        vi.mocked(sdk.getToken).mockReturnValueOnce(
            Promise.resolve(WRAPPED_NATIVE_TOKEN),
        );
        vi.mocked(sdk.getToken).mockReturnValueOnce(Promise.resolve(USDC_TOKEN));
        vi.mocked(sdk.getPool).mockReturnValueOnce(Promise.resolve(WS_USDC_POOL));

        const { position } = await mint(
            {
                ...props,
                lowerPrice: '0.5219921177818871', // -15%
                upperPrice: '0.7062246299402003', // +15%
            },
            sdk,
            publicClient,
            mockNotify,
        );

        expect(position.tickLower).toEqual(-282850);
        expect(position.tickUpper).toEqual(-279800);
        expect(position.amount0.toExact()).toEqual('10.427978627154949737');
        expect(position.amount1.toExact()).toEqual('7.499999');
    });

    it('it should create a mint position with a range defined by lowerPricePercentage and upperPricePercentage', async () => {
        const sdk: ShadowSDK = new MockShadowSDK();

        vi.mocked(sdk.getToken).mockReturnValueOnce(
            Promise.resolve(WRAPPED_NATIVE_TOKEN),
        );
        vi.mocked(sdk.getToken).mockReturnValueOnce(Promise.resolve(USDC_TOKEN));
        vi.mocked(sdk.getPool).mockReturnValueOnce(Promise.resolve(WS_USDC_POOL));

        const { position } = await mint(
            {
                ...props,
                lowerPricePercentage: 15,
                upperPricePercentage: 15,
            },
            sdk,
            publicClient,
            mockNotify,
        );

        expect(position.tickLower).toEqual(-282850);
        expect(position.tickUpper).toEqual(-279800);
        expect(position.amount0.toExact()).toEqual('10.427978627154949737');
        expect(position.amount1.toExact()).toEqual('7.499999');
    });
});
