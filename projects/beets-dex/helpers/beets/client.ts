import axios, { AxiosError, AxiosInstance } from 'axios';
import { GqlChain, GqlHook, GqlPoolFilter, GqlPoolMinimal, GqlPoolOrderBy, GqlPoolOrderDirection } from './types';

// Constants for configuration
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_RETRY_ATTEMPTS = 0;
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
        const {
            baseUrl = 'https://backend-v3.beets-ftm-node.com',
            timeout = DEFAULT_TIMEOUT,
            maxRetries = DEFAULT_RETRY_ATTEMPTS,
            retryDelay = DEFAULT_RETRY_DELAY
        } = config;

        this.maxRetries = maxRetries;
        this.retryDelay = retryDelay;

        this.axiosInstance = axios.create({
            baseURL: baseUrl,
            timeout,
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }

    private async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async executeQueryWithRetry<T>(
        query: string, 
        variables?: any,
        fragments: string[] = [],
        attempt: number = 1,
    ): Promise<T> {
        try {
            const response = await this.axiosInstance.post('', {
                query: query + fragments.join('\n'),
                variables
            });

            if (!response.data?.data) {
                throw new Error('Invalid response format from API');
            }

            return response.data.data as T;
        } catch (error) {
            // Don't retry on 4xx errors as they're typically client errors
            if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
                console.error('GraphQL Error:', error.response.data);
                throw new Error(`GraphQL query failed: ${error.message}`);
            }

            // Retry logic
            if (attempt < this.maxRetries) {
                await this.sleep(this.retryDelay * attempt); // Exponential backoff
                return this.executeQueryWithRetry<T>(query, variables, fragments, attempt + 1);
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
    async getPools(orderBy: GqlPoolOrderBy, orderDirection: GqlPoolOrderDirection, where: GqlPoolFilter): Promise<GqlPoolMinimal[]> {
        const fragments = [
            this.getHookFragment(),
            this.getUnderlyingTokenFragment(),
            this.getErc4626ReviewDataFragment(),
            this.getPoolTokensFragment(),
        ];

        let query = `
            query GetPools($where: GqlPoolFilter!, $orderBy: GqlPoolOrderBy!, $orderDirection: GqlPoolOrderDirection!) {
                poolGetPools(
                    where: $where,
                    orderBy: $orderBy,
                    orderDirection: $orderDirection
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
        }>(query, {
            where,
            orderBy,
            orderDirection
        }, fragments);

        return response.poolGetPools;
    }

    /**
     * Helper function that convert HeyAnon chain identifiers to
     * Beets chain identifiers
     */
    public getBeetsChain(chain: string): GqlChain {
        switch (chain.toUpperCase()) {
            case "SONIC": return GqlChain.Sonic;
            case "OPTIMISM": return GqlChain.Optimism;
            default: throw new Error(`Unsupported chain: ${chain}`);
        }
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

