import { FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { Address } from 'viem';
import { parseWallet } from '../utils.js';
import { ShadowSDK } from '../sdk.js';

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

        const positions = await ShadowSDK.getLpPositions(props.account, props.tokens);
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
