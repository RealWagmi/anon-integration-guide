import {
    checkToApprove,
    FunctionOptions,
    FunctionReturn,
    toResult,
    TransactionParams,
} from '@heyanon/sdk';
import { Address, Hex, parseUnits } from 'viem';
import { parsePrice, parseWallet } from '../utils.js';
import { ShadowSDK } from '../sdk.js';
import {
    nearestUsableTick,
    NonfungiblePositionManager,
    Position,
    priceToClosestTick,
} from '@kingdomdotone/v3-sdk';
import { Percent, Price } from '@uniswap/sdk-core';
import JSBI from 'jsbi';
import {
    DEFAULT_LIQUIDITY_SLIPPAGE,
    NFP_MANAGER_ADDRESS,
    SLIPPAGE_PRECISION,
} from '../constants.js';

export interface Props {
    chainName: string;
    account: Address;
    tokenA: Address;
    tokenB: Address;
    amountA: string;
    amountB: string;
    tickSpacing?: number;
    slippageTolerance?: number;
    lowerPrice?: string; // lower price as tokenB / tokenA
    upperPrice?: string; // upper price as tokenB / tokenA
    lowerPricePercentage?: number;
    upperPricePercentage?: number;
    recipient?: Address;
}

/**
 * Mints a new liquidity position on Shadow Exchange V3
 * @param props - The function `Props`
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function mintFunction(
    props: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions,
): Promise<FunctionReturn> {
    try {
        const wallet = parseWallet(props.chainName, props.account);
        if (!wallet.success) {
            return toResult(wallet.errorMessage, true);
        }

        const { chainId, account } = wallet.data;
        const provider = getProvider(chainId);
        const sdk = new ShadowSDK(chainId, provider);
        const transactions = new Array<TransactionParams>();

        try {
            const { position, calldata, msgValue } = await mint(props, sdk, notify);

            const token0 = position.pool.token0.wrapped;
            const token1 = position.pool.token1.wrapped;
            const { amount0, amount1 } = position.mintAmounts;

            await notify(`Checking ${token0.symbol} allowance...`);

            await checkToApprove({
                args: {
                    account,
                    target: token0.address as Address,
                    spender: NFP_MANAGER_ADDRESS,
                    amount: BigInt(amount0.toString()),
                },
                provider,
                transactions,
            });

            await notify(`Checking ${token1.symbol} allowance...`);

            await checkToApprove({
                args: {
                    account,
                    target: token1.address as Address,
                    spender: NFP_MANAGER_ADDRESS,
                    amount: BigInt(amount1.toString()),
                },
                provider,
                transactions,
            });

            await notify('Preparing mint transaction...');

            transactions.push({
                target: NFP_MANAGER_ADDRESS,
                data: calldata as Hex,
                value: BigInt(msgValue),
            });
        } catch (error) {
            return toResult(error instanceof Error ? error.message : String(error), true);
        }

        await notify('Waiting for transaction confirmation...');

        // Sign and send transaction
        const result = await sendTransactions({ chainId, account, transactions });
        const message = result.data[result.data.length - 1];

        return toResult(
            result.isMultisig
                ? message.message
                : `Successfully added liquidity on Shadow Exchange. ${message.message}`,
        );
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return toResult(errorMessage, true);
    }
}

export async function mint(
    props: Props,
    sdk: ShadowSDK,
    notify: (message: string) => Promise<void>,
) {
    const baseToken = await sdk.getToken(props.tokenA);
    const quoteToken = await sdk.getToken(props.tokenB);

    if (!baseToken) {
        throw new Error(`Token (${props.tokenA}) not found`);
    }
    if (!quoteToken) {
        throw new Error(`Token (${props.tokenB}) not found`);
    }

    const isBaseToken0 = baseToken.wrapped.sortsBefore(quoteToken.wrapped);
    const [token0, token1] = isBaseToken0
        ? [baseToken, quoteToken]
        : [quoteToken, baseToken];

    const pool = await sdk.getPool(token0, token1);

    if (!pool) {
        throw new Error(`Pool not found`);
    }

    // Default range of +-15% from current price
    const currentPrice = pool.priceOf(baseToken.wrapped);
    let lowerPrice = new Price(
        baseToken.wrapped,
        quoteToken.wrapped,
        JSBI.multiply(currentPrice.denominator, JSBI.BigInt(100)),
        JSBI.multiply(currentPrice.numerator, JSBI.BigInt(85)),
    );
    let upperPrice = new Price(
        baseToken.wrapped,
        quoteToken.wrapped,
        JSBI.multiply(currentPrice.denominator, JSBI.BigInt(100)),
        JSBI.multiply(currentPrice.numerator, JSBI.BigInt(115)),
    );

    if (
        (props.lowerPrice && !props.upperPrice) ||
        (!props.lowerPrice && props.upperPrice)
    ) {
        throw new Error('Both lower and upper prices must be provided');
    }

    if (
        (props.lowerPricePercentage && !props.upperPricePercentage) ||
        (!props.lowerPricePercentage && props.upperPricePercentage)
    ) {
        throw new Error('Both lower and upper prices must be provided');
    }

    if (props.lowerPrice && props.upperPrice) {
        const _lowerPrice = parsePrice(
            baseToken.wrapped,
            quoteToken.wrapped,
            props.lowerPrice,
        );
        const _upperPrice = parsePrice(
            baseToken.wrapped,
            quoteToken.wrapped,
            props.upperPrice,
        );
        if (!_lowerPrice || !_upperPrice) {
            throw new Error('Prices must be in the format of "1.23456"');
        }
        lowerPrice = _lowerPrice;
        upperPrice = _upperPrice;
    }

    if (props.lowerPricePercentage && props.upperPricePercentage) {
        const _lowerPrice = new Price(
            baseToken.wrapped,
            quoteToken.wrapped,
            JSBI.multiply(currentPrice.denominator, JSBI.BigInt(100)),
            JSBI.multiply(
                currentPrice.numerator,
                JSBI.subtract(JSBI.BigInt(100), JSBI.BigInt(props.lowerPricePercentage)),
            ),
        );
        const _upperPrice = new Price(
            baseToken.wrapped,
            quoteToken.wrapped,
            JSBI.multiply(currentPrice.denominator, JSBI.BigInt(100)),
            JSBI.multiply(
                currentPrice.numerator,
                JSBI.add(JSBI.BigInt(100), JSBI.BigInt(props.upperPricePercentage)),
            ),
        );
        if (!_lowerPrice || !_upperPrice) {
            throw new Error('Price percentages must be between 0 and 100');
        }
        lowerPrice = _lowerPrice;
        upperPrice = _upperPrice;
    }

    const amountBase = parseUnits(props.amountA, baseToken.decimals);
    const amountQuote = parseUnits(props.amountB, quoteToken.decimals);

    const amount0 = isBaseToken0 ? amountBase : amountQuote;
    const amount1 = isBaseToken0 ? amountQuote : amountBase;

    const tickLower = nearestUsableTick(priceToClosestTick(lowerPrice), pool.tickSpacing);
    const tickUpper = nearestUsableTick(priceToClosestTick(upperPrice), pool.tickSpacing);
    const slippageTolerance = props.slippageTolerance
        ? new Percent(
              Math.round(props.slippageTolerance * SLIPPAGE_PRECISION),
              SLIPPAGE_PRECISION * 100,
          )
        : DEFAULT_LIQUIDITY_SLIPPAGE;

    const position = Position.fromAmounts({
        pool,
        tickLower,
        tickUpper,
        amount0: amount0.toString(),
        amount1: amount1.toString(),
        useFullPrecision: true,
    });

    notify(
        `Creating new position with ${position.amount0.toSignificant(6)} ${token0.symbol} and ${position.amount1.toSignificant(6)} ${token1.symbol}...`,
    );

    const mintNativeToken = [token0, token1].find((tk) => tk.isNative);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now

    const { calldata, value: msgValue } = NonfungiblePositionManager.addCallParameters(
        position,
        {
            slippageTolerance,
            recipient: props.recipient ?? props.account,
            deadline,
            useNative: mintNativeToken,
        },
    );

    return { position, calldata, msgValue };
}
