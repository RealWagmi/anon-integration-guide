import { ChainId, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address } from 'viem';
import { parseWallet } from '../utils.js';
import { getClPositions } from '../subgraph.js';
import { FeeAmount, Pool, Position } from '@kingdomdotone/v3-sdk';
import { Token } from '@uniswap/sdk-core';

export interface Props {
    chainName: string;
    account: Address;
    tokens?: string[];
}

/**
 * Get account liquidity positions on Shadow Exchange V3
 * @param props - The function `Props`
 * @param tools - System tools for blockchain interactions
 * @returns positions on Shadow Exchange
 */
export async function getLPPositionsFunction(
    props: Props,
    {}: FunctionOptions,
): Promise<FunctionReturn> {
    try {
        const wallet = parseWallet(props.chainName, props.account);
        if (!wallet.success) {
            return toResult(wallet.errorMessage, true);
        }

        const positions = await getLpPositions(props);
        let message = 'LP Positions:\n';
        for (const { position, poolSymbol, tokenId } of positions) {
            const token0 = position.pool.token0;
            const token1 = position.pool.token1;

            const amount0 = +Number(position.amount0.toExact()).toPrecision(6);
            const amount1 = +Number(position.amount1.toExact()).toPrecision(6);

            const lowerPrice = position.token0PriceLower.toSignificant(6);
            const upperPrice = position.token0PriceUpper.toSignificant(6);

            message += `\t${poolSymbol} #${tokenId}:\n`;
            message += `\t\tLiquidity: ${amount0} ${token0.symbol} and ${amount1} ${token1.symbol}\n`;
            message += `\t\tPrice range: ${lowerPrice} ${token1.symbol}/${token0.symbol} to ${upperPrice} ${token1.symbol}/${token0.symbol}\n`;
        }

        return toResult(message, false);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return toResult(errorMessage, true);
    }
}

export async function getLpPositions(props: Props) {
    let positions = await getClPositions(props.account);

    if (props.tokens && props.tokens.length > 0) {
        const tokensFilter = props.tokens.map((token) => token.toLowerCase());
        positions = positions.filter(
            (position) =>
                tokensFilter.includes(position.token0.id.toLowerCase()) ||
                tokensFilter.includes(position.token1.id.toLowerCase()),
        );
    }

    return positions.map((position) => {
        const pool = new Pool(
            new Token(
                ChainId.SONIC,
                position.token0.id,
                +position.token0.decimals,
                position.token0.symbol,
            ),
            new Token(
                ChainId.SONIC,
                position.token1.id,
                +position.token1.decimals,
                position.token1.symbol,
            ),
            +position.pool.feeTier as FeeAmount,
            position.pool.sqrtPrice,
            position.pool.liquidity,
            +position.pool.tick,
            [],
            +position.pool.tickSpacing,
        );

        return {
            position: new Position({
                pool,
                liquidity: position.liquidity,
                tickLower: +position.tickLower.tickIdx,
                tickUpper: +position.tickUpper.tickIdx,
            }),
            poolSymbol: position.pool.symbol,
            tokenId: +position.id,
        };
    });
}
