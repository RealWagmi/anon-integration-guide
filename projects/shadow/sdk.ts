import { computePoolAddress, FeeAmount, Pool, Position } from '@kingdomdotone/v3-sdk';
import { Token } from '@uniswap/sdk-core';
import { Address, erc20Abi, getAddress, PublicClient } from 'viem';
import { getClPoolsByTokens, getClPositions } from './subgraph.js';
import { CL_POOL_INIT_CODE_HASH, POOL_DEPLOYER_ADDRESS } from './constants.js';
import { CL_POOL_ABI } from './abis/clPool.js';
import { AnyToken } from './tokens.js';
import { ChainId } from '@heyanon/sdk';

export class ShadowSDK {
    constructor(
        private chainId: number,
        private viem: PublicClient,
    ) {}

    // Gets all positions for a given account using the subgraph
    static async getLpPositions(account: Address, tokens?: string[]) {
        let positions = await getClPositions(account);

        if (tokens && tokens.length > 0) {
            const tokensFilter = tokens.map((token) => token.toLowerCase());
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

    // Gets a token's name, symbol, and decimals from the ERC20 contract
    async getToken(tokenAddress: Address): Promise<AnyToken | undefined> {
        try {
            const [name, symbol, decimals] = await this.viem.multicall({
                contracts: [
                    {
                        address: tokenAddress,
                        abi: erc20Abi,
                        functionName: 'name',
                        args: [],
                    },
                    {
                        address: tokenAddress,
                        abi: erc20Abi,
                        functionName: 'symbol',
                        args: [],
                    },
                    {
                        address: tokenAddress,
                        abi: erc20Abi,
                        functionName: 'decimals',
                        args: [],
                    },
                ],
            });

            if (!name.result || !decimals.result || !symbol.result) {
                return undefined;
            }

            return new Token(
                this.chainId,
                tokenAddress,
                decimals.result,
                symbol.result,
                name.result,
            );
        } catch (e) {
            return undefined;
        }
    }

    // Gets a pool for a given pair of tokens and tick spacing using onchain calls
    async getPool(
        token0: AnyToken,
        token1: AnyToken,
        tickSpacing?: number,
    ): Promise<Pool | undefined> {
        try {
            if (!tickSpacing) {
                const pools = await getClPoolsByTokens(token0, token1);
                const sortedPools = pools.sort(
                    (a, b) =>
                        parseFloat(a.totalValueLockedUSD) -
                        parseFloat(b.totalValueLockedUSD),
                );
                tickSpacing = +sortedPools[0].tickSpacing;
            }

            const poolAddress = getPoolAddress(token0, token1, tickSpacing);

            const [fee, slot0, liquidity] = await this.viem.multicall({
                contracts: [
                    {
                        address: poolAddress,
                        abi: CL_POOL_ABI,
                        functionName: 'fee',
                        args: [],
                    },
                    {
                        address: poolAddress,
                        abi: CL_POOL_ABI,
                        functionName: 'slot0',
                        args: [],
                    },
                    {
                        address: poolAddress,
                        abi: CL_POOL_ABI,
                        functionName: 'liquidity',
                        args: [],
                    },
                ],
            });

            if (!fee.result || !slot0.result || liquidity.result == null) {
                return undefined;
            }

            const feeTier = fee.result;
            const sqrtPrice = slot0.result[0];
            const tick = slot0.result[1];

            return new Pool(
                token0.wrapped,
                token1.wrapped,
                feeTier,
                sqrtPrice.toString(),
                liquidity.result.toString(),
                tick,
                [],
                tickSpacing,
            );
        } catch (e) {
            return undefined;
        }
    }
}

// Computes the pool address for a given pair of tokens and tick spacing
export function getPoolAddress(
    token0: AnyToken,
    token1: AnyToken,
    tickSpacing: number,
): Address {
    return getAddress(
        computePoolAddress({
            factoryAddress: POOL_DEPLOYER_ADDRESS,
            tokenA: token0.wrapped,
            tokenB: token1.wrapped,
            tickSpacing,
            initCodeHashManualOverride: CL_POOL_INIT_CODE_HASH,
        }),
    );
}
