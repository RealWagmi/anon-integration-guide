import { computePoolAddress, Pool } from '@kingdomdotone/v3-sdk';
import { Token } from '@uniswap/sdk-core';
import { Address, erc20Abi, getAddress, PublicClient } from 'viem';
import { getClPoolsByTokens } from './subgraph.js';
import { CL_POOL_INIT_CODE_HASH, POOL_DEPLOYER_ADDRESS } from './constants.js';
import { CL_POOL_ABI } from './abis/clPool.js';
import { AnyToken } from './tokens.js';

export class ShadowSDK {
    constructor(
        private chainId: number,
        private viem: PublicClient,
    ) {}

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
