import axios, { AxiosInstance, AxiosError } from 'axios';

// API base URLs
const API_BASE_URL = 'https://api.beefy.finance';
const DATABARN_BASE_URL = 'https://databarn.beefy.com/api/v1/beefy';

// Default timeout in milliseconds (15 seconds)
const DEFAULT_TIMEOUT = 15000;

// Types
export interface VaultInfo {
    id: string;
    name: string;
    type: string;
    token: string;
    tokenAddress?: `0x${string}`; // not set for chain tokens e.g. ETH on Ethereum
    tokenDecimals: number;
    tokenProviderId?: string;
    earnedToken: string;
    earnedTokenAddress: `0x${string}`;
    earnContractAddress: `0x${string}`;
    oracle: string;
    oracleId: string;
    status: string;
    createdAt: number;
    platformId: string;
    assets: string[];
    retireReason?: string;
    retiredAt?: number;
    pausedAt?: number;
    risks?: string[];
    strategyTypeId?: string;
    buyTokenUrl?: string;
    addLiquidityUrl?: string;
    removeLiquidityUrl?: string;
    network: string;
    zaps?: {
        strategyId: string;
        ammId: string;
    }[];
    isGovVault: boolean;
    chain: string;
    strategy: string;
    lastHarvest: number;
    pricePerFullShare: string;
}

export interface ApyBreakdown {
    [vaultId: string]: ApyBreakdownItem;
}

export interface ApyBreakdownItem {
    totalApy: number;
    vaultApr: number;
    compoundingsPerYear: number;
    beefyPerformanceFee: number;
    vaultApy: number;
    tradingApr?: number;
    composablePoolApr?: number;
    liquidStakingApr?: number;
}

export interface TvlInDollarsData {
    [chain: string]: {
        [vaultId: string]: number;
    };
}

export interface PriceData {
    [tokenId: string]: number;
}

export interface LpData {
    [lpId: string]: number;
}

export interface LpBreakdown {
    [lpId: string]: {
        price: number;
        tokens: string[];
        balances: number[];
        totalSupply: number;
    };
}

export interface TokenInfo {
    type: 'erc20' | 'native';
    id: string;
    symbol: string;
    name: string;
    chainId: number;
    oracle: 'tokens' | 'lps';
    oracleId: string;
    address: `0x${string}`;
    decimals: number;
}

export interface TokensResponse {
    [chain: string]: {
        [tokenId: string]: TokenInfo;
    };
}

export interface ConfigAddresses {
    [chain: string]: {
        devMultisig?: string;
        treasuryMultisig?: string;
        strategyOwner?: string;
        vaultOwner?: string;
        keeper?: string;
        treasurer?: string;
        launchpoolOwner?: string;
        beefyFeeRecipient?: string;
        multicall?: string;
        voter?: string;
        beefyFeeConfig?: string;
        vaultFactory?: string;
        strategyFactory?: string;
        zap?: string;
        zapTokenManager?: string;
        clmFactory?: string;
        clmStrategyFactory?: string;
        clmRewardPoolFactory?: string;
        positionMulticall?: string;
        beefySwapper?: string;
        beefyOracle?: string;
        beefyOracleChainlink?: string;
        beefyOracleUniswapV2?: string;
        beefyOracleUniswapV3?: string;
        rewardPool?: string;
        treasury?: string;
        bifiMaxiStrategy?: string;
        [key: string]: string | undefined;
    };
}

export interface BoostInfo {
    id: string;
    name: string;
    assets: string[];
    chain: string;
    poolId: string;
    version: number;
    status: string;
    earnContractAddress: `0x${string}`;
    tokenAddress: `0x${string}`;
    earnedToken: string;
    earnedTokenDecimals: number;
    earnedTokenAddress: `0x${string}`;
    earnedOracle: string;
    earnedOracleId: string;
    partners: string[];
    partnership: boolean;
    isMooStaked: boolean;
    periodFinish: number;
    periodFinishes: number[];
}

export interface TimelineEntry {
    datetime: string;
    product_key: string;
    display_name: string;
    chain: string;
    is_eol: boolean;
    is_dashboard_eol: boolean;
    transaction_hash: string;
    share_to_underlying_price: number;
    underlying_to_usd_price: number | null;
    share_balance: number;
    underlying_balance: number;
    usd_balance: number | null;
    share_diff: number;
    underlying_diff: number;
    usd_diff: number | null;
}

export interface ProductData {
    productKey: string;
    chain: string;
    productData: {
        type: string;
        dashboardEol: boolean;
        vault?: {
            id: string;
            chain: string;
            token_name: string;
            token_decimals: number;
            contract_address: `0x${string}`;
            want_address: `0x${string}`;
            want_decimals: number;
            eol: boolean;
            eol_date: string | null;
            assets: string[];
            protocol: string;
            protocol_product: string;
            want_price_feed_key: string;
        };
        boost?: {
            id: string;
            chain: string;
            vault_id: string;
            name: string;
            contract_address: `0x${string}`;
            eol: boolean;
            eol_date: string | null;
            staked_token_address: `0x${string}`;
            staked_token_decimals: number;
            vault_want_address: `0x${string}`;
            vault_want_decimals: number;
            reward_token_decimals: number;
            reward_token_symbol: string;
            reward_token_address: `0x${string}`;
            reward_token_price_feed_key: string;
        };
    };
}

/**
 * Error class for Beefy API errors
 */
export class BeefyApiError extends Error {
    public status?: number;
    public data?: any;

    constructor(message: string, status?: number, data?: any) {
        super(message);
        this.name = 'BeefyApiError';
        this.status = status;
        this.data = data;
    }
}

/**
 * Beefy Finance API client
 */
export class BeefyClient {
    private apiClient: AxiosInstance;
    private databarnClient: AxiosInstance;

    /**
     * Create a new Beefy Finance API client
     * @param timeout Request timeout in milliseconds (default: 15000)
     */
    constructor(timeout: number = DEFAULT_TIMEOUT) {
        // Create API client
        this.apiClient = axios.create({
            baseURL: API_BASE_URL,
            timeout,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });

        // Create Databarn client
        this.databarnClient = axios.create({
            baseURL: DATABARN_BASE_URL,
            timeout,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });
    }

    /**
     * Handle API errors
     */
    private handleError(error: unknown): never {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            throw new BeefyApiError(axiosError.message, axiosError.response?.status, axiosError.response?.data);
        }
        if (error instanceof Error) {
            throw new BeefyApiError(error.message);
        }
        throw new BeefyApiError('Unknown error occurred');
    }

    /**
     * Get all vaults
     * Provides live information about each Beefy vault, including retired (eol) vaults.
     */
    @staticMemoize()
    async getVaults(): Promise<VaultInfo[]> {
        try {
            const response = await this.apiClient.get('/vaults');
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get APY breakdown for all vaults
     * Provides more detailed information relating to the yield of each Beefy vault
     */
    @staticMemoize()
    async getApyBreakdown(): Promise<ApyBreakdown> {
        try {
            const response = await this.apiClient.get('/apy/breakdown');
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get Total Value Locked for all vaults
     * Provides the current and live total value locked of each Beefy vault
     */
    @staticMemoize()
    async getTvl(): Promise<TvlInDollarsData> {
        try {
            const response = await this.apiClient.get('/tvl');
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get token prices
     * All token prices under the same endpoint
     */
    async getPrices(): Promise<PriceData> {
        try {
            const response = await this.apiClient.get('/prices');
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get liquidity pool prices
     * Provides the current live prices of underlying liquidity pools used by each Beefy vaults
     */
    async getLps(): Promise<LpData> {
        try {
            const response = await this.apiClient.get('/lps');
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get liquidity pool breakdown
     * Provides more detailed information relating to the liquidity pool used by each Beefy vault
     */
    @staticMemoize()
    async getLpsBreakdown(): Promise<LpBreakdown> {
        try {
            const response = await this.apiClient.get('/lps/breakdown');
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get tokens
     * Provides information on all of the tokens utilised by Beefy
     */
    @staticMemoize()
    async getTokens(): Promise<TokensResponse> {
        try {
            const response = await this.apiClient.get('/tokens');
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get Beefy configuration
     * Provides information on the addresses of the current configuration of wallets
     */
    @staticMemoize()
    async getConfig(): Promise<ConfigAddresses> {
        try {
            const response = await this.apiClient.get('/config');
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Get Boosts
     * Provides information on all Launchpool Boosts hosted by Beefy
     */
    @staticMemoize()
    async getBoosts(): Promise<BoostInfo[]> {
        try {
            const response = await this.apiClient.get('/boosts');
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Returns the timeline of transactions for a given investor, including deposits,
     * withdraws and transfers
     * @param address Investor address
     */
    async getAddressTimeline(address: string): Promise<TimelineEntry[]> {
        try {
            const response = await this.databarnClient.get('/timeline', {
                params: { address },
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Returns the Beefy products (including vaults) active on a given chain
     * @param chain Chain name
     * @param includeEol Include EOL (end of life) products
     */
    async getProductsByChain(chain: string, includeEol: boolean = false): Promise<ProductData[]> {
        try {
            const response = await this.databarnClient.get(`/product/${chain}`, {
                params: includeEol ? { include_eol: true } : {},
            });
            return response.data;
        } catch (error) {
            this.handleError(error);
        }
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

export default BeefyClient;
