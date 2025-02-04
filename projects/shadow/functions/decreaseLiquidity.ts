import {
    checkToApprove,
    FunctionOptions,
    FunctionReturn,
    toResult,
    TransactionParams,
} from '@heyanon/sdk';
import { Address, Hex } from 'viem';
import { parseWallet } from '../utils.js';
import { ShadowSDK } from '../sdk.js';
import { NonfungiblePositionManager, Position } from '@kingdomdotone/v3-sdk';
import { CurrencyAmount, Percent } from '@uniswap/sdk-core';
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
    decreasePercentage: number;
    tokenId?: number;
    slippageTolerance?: number;
}

export async function decreaseLiquidityFunction(
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
            const { position, calldata, msgValue } = await decreaseLiquidity(
                props,
                sdk,
                notify,
            );

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

            await notify('Preparing decrease liquidity transaction...');

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

export async function decreaseLiquidity(
    props: Props,
    sdk: ShadowSDK,
    notify: (message: string) => Promise<void>,
) {
    const allPositions = await ShadowSDK.getLpPositions(props.account, [
        props.tokenA,
        props.tokenB,
    ]);
    if (allPositions.length == 0) {
        throw new Error('No positions found');
    }
    const position = props.tokenId
        ? allPositions.find((position) => position.tokenId == props.tokenId)
        : allPositions[0];

    if (!position) {
        throw new Error('No position found with the specified ID');
    }

    await notify(
        `Found position with token ID ${position.tokenId} for pool ${position.poolSymbol}`,
    );

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

    const slippageTolerance = props.slippageTolerance
        ? new Percent(
              Math.round(props.slippageTolerance * SLIPPAGE_PRECISION),
              SLIPPAGE_PRECISION * 100,
          )
        : DEFAULT_LIQUIDITY_SLIPPAGE;

    // Fetch pool again the get the latest slot0 data
    const pool = await sdk.getPool(
        position.position.pool.token0,
        position.position.pool.token1,
        position.position.pool.tickSpacing,
    );
    if (!pool) {
        throw new Error(`Pool not found`);
    }

    const sdkPosition = new Position({
        pool,
        tickLower: position.position.tickLower,
        tickUpper: position.position.tickUpper,
        liquidity: position.position.liquidity,
    });

    const liquidityPercentage = new Percent(
        Math.round(props.decreasePercentage * 100),
        1e4,
    );

    await notify(
        `Decreasing position #${position.tokenId} by ${liquidityPercentage.toFixed(2)}`,
    );

    const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 minutes from now

    const { calldata, value: msgValue } = NonfungiblePositionManager.removeCallParameters(
        sdkPosition,
        {
            tokenId: position.tokenId,
            liquidityPercentage,
            slippageTolerance,
            burnToken: liquidityPercentage.equalTo(1),
            deadline,
            collectOptions: {
                expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(token0, 0),
                expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(token1, 0),
                recipient: props.account,
            },
        },
    );

    return { position: sdkPosition, calldata, msgValue };
}
