import axios, { AxiosInstance } from 'axios';
import { GqlChain, GqlPoolFilter, GqlPoolMinimal, GqlPoolOrderBy, GqlPoolOrderDirection, GqlSorGetSwapsResponse, GqlSorSwapType, GqlToken } from './types';

/**
 * Custom error class for errors that should not be retried
 */
class NoRetryError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NoRetryError';
    }
}

// Constants for configuration
const DEFAULT_TIMEOUT = 15000; // 15 seconds
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

interface BeetsClientConfig {
    baseUrl?: string;
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
}

export class BeetsClient {
    private readonly axiosInstance: AxiosInstance;
    private readonly maxRetries: number;
    private readonly retryDelay: number;

    constructor(config: BeetsClientConfig = {}) {
        const { baseUrl = 'https://backend-v3.beets-ftm-node.com', timeout = DEFAULT_TIMEOUT, maxRetries = DEFAULT_RETRY_ATTEMPTS, retryDelay = DEFAULT_RETRY_DELAY } = config;

        this.maxRetries = maxRetries;
        this.retryDelay = retryDelay;

        this.axiosInstance = axios.create({
            baseURL: baseUrl,
            timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    private async sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private async executeQueryWithRetry<T>(query: string, variables?: any, fragments: string[] = [], attempt: number = 1): Promise<T> {
        const queryWithFragments = query + fragments.join('\n');
        try {
            const response = await this.axiosInstance.post('', {
                query: queryWithFragments,
                variables,
            });

            if (response.data?.errors && response.data?.errors?.length > 0) {
                // Use NoRetryError to signal that this error should not be retried
                throw new NoRetryError(`${response.data.errors[0].message}`);
            }

            if (!response.data?.data) {
                throw new Error('Empty response from subgraph');
            }

            return response.data.data as T;
        } catch (error) {
            // Don't retry on 4xx errors as they're typically client errors
            if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
                console.error('GraphQL Error:', error.response.data);
                throw new Error(`GraphQL query failed: ${error.message}`);
            }

            // Don't retry on GraphQL errors (identified by NoRetryError)
            if (error instanceof NoRetryError) {
                throw new Error(`GraphQL query failed: ${error.message}`);
            }

            // Retry logic
            if (attempt < this.maxRetries) {
                await this.sleep(this.retryDelay * attempt); // Exponential backoff
                return this.executeQueryWithRetry<T>(queryWithFragments, variables, fragments, attempt + 1);
            }

            // If we've exhausted all retries, throw the error
            if (axios.isAxiosError(error)) {
                throw new Error(`GraphQL query failed: ${error.message}`);
            }
            throw new Error(`Unexpected error during GraphQL query: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get Beets pools based on the provided filters
     *
     * Same query as https://beets.fi/pools
     */
    async getPools(
        orderBy: GqlPoolOrderBy,
        orderDirection: GqlPoolOrderDirection,
        first: number,
        where: GqlPoolFilter = {},
        textSearch: string | null = null,
    ): Promise<GqlPoolMinimal[]> {
        const fragments = [this.getHookFragment(), this.getUnderlyingTokenFragment(), this.getErc4626ReviewDataFragment(), this.getPoolTokensFragment()];

        const query = `
            query GetPools($where: GqlPoolFilter!, $orderBy: GqlPoolOrderBy!, $orderDirection: GqlPoolOrderDirection!, $first: Int!, $textSearch: String) {
                poolGetPools(
                    where: $where,
                    first: $first,
                    orderBy: $orderBy,
                    orderDirection: $orderDirection,
                    textSearch: $textSearch
                ) {
                    id
                    address
                    chain
                    createTime
                    decimals
                    protocolVersion
                    tags
                    hasErc4626
                    hasNestedErc4626
                    hasAnyAllowedBuffer
                    hook {
                        ...Hook
                    }
                    poolTokens {
                        id
                        address
                        symbol
                        weight
                        name
                        nestedPool {
                            id
                            address
                            symbol
                            name
                            tokens {
                                id
                                address
                                symbol
                                weight
                                name
                            }
                        }
                    }
                    dynamicData {
                        totalLiquidity
                        lifetimeVolume
                        lifetimeSwapFees
                        volume24h
                        fees24h
                        holdersCount
                        swapFee
                        swapsCount
                        totalShares
                        aprItems {
                            id
                            title
                            apr
                            type
                            rewardTokenSymbol
                            rewardTokenAddress
                        }
                    }
                    staking {
                        id
                        type
                        chain
                        address
                        gauge {
                            id
                            gaugeAddress
                            version
                            status
                            workingSupply
                            otherGauges {
                                gaugeAddress
                                version
                                status
                                id
                                rewards {
                                    id
                                    tokenAddress
                                    rewardPerSecond
                                }
                            }
                            rewards {
                                id
                                rewardPerSecond
                                tokenAddress
                            }
                        }
                        aura {
                            id
                            apr
                            auraPoolAddress
                            auraPoolId
                            isShutdown
                        }
                    }
                    factory
                    id
                    name
                    owner
                    swapFeeManager
                    pauseManager
                    poolCreator
                    symbol
                    type
                    userBalance {
                        totalBalance
                        totalBalanceUsd
                        walletBalance
                        walletBalanceUsd
                        stakedBalances {
                            balance
                            balanceUsd
                            stakingType
                            stakingId
                        }
                    }
                    poolTokens {
                        ...PoolTokens
                    }
                }
            }
        `;

        const response = await this.executeQueryWithRetry<{
            poolGetPools: GqlPoolMinimal[];
        }>(
            query,
            {
                where,
                orderBy,
                first,
                orderDirection,
                textSearch,
            },
            fragments,
        );

        return response.poolGetPools;
    }

    /**
     * Get a specific pool based on the provided id, chain and optionally a user address
     *
     * Same query as https://beets.fi/pools/sonic/v3/0x43026d483f42fb35efe03c20b251142d022783f2
     */
    async getPool(id: string, chain: GqlChain, userAddress: string = ''): Promise<GqlPoolMinimal> {
        const fragments = [this.getHookFragment(), this.getUnderlyingTokenFragment(), this.getErc4626ReviewDataFragment(), this.getPoolTokensFragment()];

        const query = `
            query GetPool($id: String!, $chain: GqlChain!, $userAddress: String) {
              pool: poolGetPool(id: $id, chain: $chain, userAddress: $userAddress) {
                id
                address
                name
                version
                owner
                swapFeeManager
                pauseManager
                poolCreator
                decimals
                factory
                symbol
                createTime
                type
                chain
                protocolVersion
                tags
                hasErc4626
                hasNestedErc4626
                hasAnyAllowedBuffer
                liquidityManagement {
                  disableUnbalancedLiquidity
                }
                hook {
                  ...Hook
                }
                dynamicData {
                  poolId
                  swapEnabled
                  totalLiquidity
                  totalShares
                  fees24h
                  surplus24h
                  swapFee
                  volume24h
                  holdersCount
                  isInRecoveryMode
                  isPaused
                  aprItems {
                    id
                    title
                    apr
                    type
                    rewardTokenSymbol
                    rewardTokenAddress
                  }
                }
                allTokens {
                  id
                  address
                  name
                  symbol
                  decimals
                  isNested
                  isPhantomBpt
                  isMainToken
                }
                staking {
                  id
                  type
                  chain
                  address
                  gauge {
                    id
                    gaugeAddress
                    version
                    status
                    workingSupply
                    otherGauges {
                      gaugeAddress
                      version
                      status
                      id
                      rewards {
                        id
                        tokenAddress
                        rewardPerSecond
                      }
                    }
                    rewards {
                      id
                      rewardPerSecond
                      tokenAddress
                    }
                  }
                  aura {
                    id
                    apr
                    auraPoolAddress
                    auraPoolId
                    isShutdown
                  }
                }
                userBalance {
                  totalBalance
                  totalBalanceUsd
                  walletBalance
                  walletBalanceUsd
                  stakedBalances {
                    balance
                    balanceUsd
                    stakingType
                    stakingId
                  }
                }
                ... on GqlPoolWeighted {
                  nestingType
                  poolTokens {
                    ...PoolTokens
                  }
                }
                ... on GqlPoolStable {
                  amp
                  poolTokens {
                    ...PoolTokens
                  }
                }
                ... on GqlPoolMetaStable {
                  amp
                  poolTokens {
                    ...PoolTokens
                  }
                }
                ... on GqlPoolElement {
                  unitSeconds
                  principalToken
                  baseToken
                  poolTokens {
                    ...PoolTokens
                  }
                }
                ... on GqlPoolComposableStable {
                  amp
                  nestingType
                  bptPriceRate
                  poolTokens {
                    ...PoolTokens
                  }
                }
                ... on GqlPoolLiquidityBootstrapping {
                  name
                  nestingType
                  poolTokens {
                    ...PoolTokens
                  }
                }
                ... on GqlPoolGyro {
                  alpha
                  beta
                  type
                  c
                  dSq
                  lambda
                  root3Alpha
                  s
                  sqrtAlpha
                  sqrtBeta
                  tauAlphaX
                  tauAlphaY
                  tauBetaX
                  tauBetaY
                  u
                  v
                  w
                  z
                  nestingType
                  poolTokens {
                    ...PoolTokens
                  }
                }
                ... on GqlPoolFx {
                  alpha
                  beta
                  delta
                  epsilon
                  lambda
                  poolTokens {
                    ...PoolTokens
                  }
                }
              }
            }
        `;

        const response = await this.executeQueryWithRetry<{
            pool: GqlPoolMinimal;
        }>(
            query,
            {
                id,
                chain,
                userAddress,
            },
            fragments,
        );

        return response.pool;
    }

    /**
     * Get SOR swaps; same query as done by the swap widget
     */
    async getSorSwap(tokenIn: string, tokenOut: string, swapType: GqlSorSwapType, swapAmount: string, chain: GqlChain): Promise<GqlSorGetSwapsResponse> {
        const query = `
            query GetSorSwaps($tokenIn: String!, $tokenOut: String!, $swapType: GqlSorSwapType!, $swapAmount: AmountHumanReadable!, $chain: GqlChain!, $poolIds: [String!]) {
                swaps: sorGetSwapPaths(
                    tokenIn: $tokenIn
                    tokenOut: $tokenOut
                    swapType: $swapType
                    swapAmount: $swapAmount
                    chain: $chain
                    poolIds: $poolIds
                ) {
                    effectivePrice
                    effectivePriceReversed
                    swapType
                    paths {
                        inputAmountRaw
                        outputAmountRaw
                        pools
                        isBuffer
                        protocolVersion
                        tokens {
                            address
                            decimals
                        }
                    }
                    priceImpact {
                        priceImpact
                        error
                    }
                    returnAmount
                    routes {
                        hops {
                            pool {
                                symbol
                            }
                            poolId
                            tokenIn
                            tokenInAmount
                            tokenOut
                            tokenOutAmount
                        }
                        share
                        tokenInAmount
                        tokenInAmount
                        tokenOut
                        tokenOutAmount
                        
                    }
                    swapAmount
                    swaps {
                        amount
                        assetInIndex
                        assetOutIndex
                        poolId
                        userData
                    }
                    tokenIn
                    tokenInAmount
                    tokenOut
                    tokenOutAmount
                    protocolVersion
                }
              }
        `;

        const response = await this.executeQueryWithRetry<{
            swaps: GqlSorGetSwapsResponse;
        }>(query, {
            tokenIn,
            tokenOut,
            swapType,
            swapAmount,
            chain,
        });

        return response.swaps;
    }

    /**
     * Get all tokens on the given chains
     */
    @staticMemoize((chains: GqlChain[]) => [...chains].sort().join(','))
    async getTokens(chains: GqlChain[]): Promise<GqlToken[]> {
        const query = `
            query GetTokens($chains: [GqlChain!]) {
                tokenGetTokens(chains: $chains) {
                    name
                    symbol
                    address
                    decimals
                    chain
                    chainId
                }
            }
        `;

        const response = await this.executeQueryWithRetry<{
            tokenGetTokens: GqlToken[];
        }>(query, {
            chains,
        });

        return response.tokenGetTokens;
    }

    /**
     * Hook fragment
     */
    private getHookFragment(): string {
        return `
            fragment Hook on GqlHook {
                address
                dynamicData {
                    addLiquidityFeePercentage
                    maxSurgeFeePercentage
                    removeLiquidityFeePercentage
                    surgeThresholdPercentage
                    swapFeePercentage
                }
                reviewData {
                    summary
                    warnings
                    reviewFile
                }
                shouldCallAfterAddLiquidity
                shouldCallAfterInitialize
                shouldCallAfterRemoveLiquidity
                shouldCallAfterSwap
                shouldCallBeforeAddLiquidity
                shouldCallBeforeInitialize
                shouldCallBeforeRemoveLiquidity
                shouldCallBeforeSwap
                shouldCallComputeDynamicSwapFee
                enableHookAdjustedAmounts    
            }
        `;
    }

    /**
     * Pool tokens fragment
     */
    private getPoolTokensFragment(): string {
        return `
            fragment PoolTokens on GqlPoolTokenDetail {
                id
                chain
                chainId
                address
                decimals
                name
                symbol
                priority
                tradable
                isErc4626
                index
                balance
                balanceUSD
                priceRate
                decimals
                weight
                hasNestedPool
                isAllowed
                priceRateProvider
                logoURI
                priceRateProviderData {
                    address
                    name
                    summary
                    reviewed
                    warnings
                    upgradeableComponents {
                        entryPoint
                        implementationReviewed
                    }
                    reviewFile
                    factory
                }
                nestedPool {
                    id
                    address
                    type
                    bptPriceRate
                    nestedPercentage
                    nestedShares
                    totalLiquidity
                    totalShares
                    tokens {
                        index
                        address
                        decimals
                        balance
                        balanceUSD
                        symbol
                        weight
                        isErc4626
                        isBufferAllowed
                        logoURI
                        underlyingToken {
                            ...UnderlyingToken
                        }
                        erc4626ReviewData {
                            ...Erc4626ReviewData
                        }
                    }
                    hook {
                        ...Hook
                    }
                }
                isErc4626
                isBufferAllowed
                underlyingToken {
                    ...UnderlyingToken
                }
                erc4626ReviewData {
                    ...Erc4626ReviewData
                }
            }
        `;
    }

    /**
     * Underlying token fragment
     */
    private getUnderlyingTokenFragment(): string {
        return `
            fragment UnderlyingToken on GqlToken {
                chain
                chainId
                address
                decimals
                name
                symbol
                priority
                tradable
                isErc4626
                isBufferAllowed
                logoURI
            }
        `;
    }

    /**
     * Erc4626 review data fragment
     */
    private getErc4626ReviewDataFragment(): string {
        return `
            fragment Erc4626ReviewData on Erc4626ReviewData {
                reviewFile
                summary
                warnings
            }
        `;
    }
}

/**
 * A decorator for memoizing asynchronous methods.
 *
 * Potential pitfalls, not relevant for our use case:
 * 1. Pending Promise Race Condition: If the decorated method is called concurrently with the same arguments,
 *    the original function is not cached until it finishes executing, potentially triggering duplicate API calls.
 * 2. Shared Cache Across Instances: The cache is defined in the decorator closure and is shared across all instances,
 *    which can lead to unintended behavior if different instances (e.g. differing by baseUrl) should have separate
 *    cache entries.
 */
function staticMemoize(cacheKeyFn?: (...args: any[]) => string) {
    const cache = new Map<string, any>();

    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const key = cacheKeyFn ? cacheKeyFn(...args) : JSON.stringify(args);

            if (cache.has(key)) {
                return cache.get(key);
            }

            const result = await originalMethod.apply(this, args);
            cache.set(key, result);
            return result;
        };

        // Add static method to clear cache
        target.constructor[`clear${propertyKey}Cache`] = () => {
            cache.clear();
        };

        return descriptor;
    };
}
