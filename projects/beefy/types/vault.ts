export interface Vault {
    id: string;
    name: string;
    type: string;
    token: string;
    tokenAddress?: string;
    tokenDecimals: number;
    tokenProviderId?: string;
    earnedToken: string;
    earnedTokenAddress: string;
    earnContractAddress: string;
    oracle: string;
    oracleId: string;
    status: string;
    createdAt: number;
    retireReason?: string;
    retiredAt?: number;
    platformId: string;
    assets: string[];
    risks?: string[];
    strategyTypeId: string;
    buyTokenUrl?: string;
    addLiquidityUrl?: string;
    removeLiquidityUrl?: string;
    network: string;
    zaps?: Zap[];
    isGovVault: boolean;
    chain: string;
    strategy: string;
    lastHarvest: number;
    pricePerFullShare: string;
    migrationIds?: string[];
    pointStructureIds?: string[];
    lendingOracle?: LendingOracle;
    pausedAt?: number;
    updatedAt?: number;
    depositFee?: number;
    refund?: boolean;
    refundContractAddress?: string;
    showWarning?: boolean;
    warning?: string;
    earningPoints?: boolean;
    poolTogether?: string;
    retiredReason?: string;
    bridged?: Bridged;
}

export interface Zap {
    strategyId: string;
    ammId?: string;
    poolAddress?: string;
    methods?: Method[];
    poolId?: string;
    poolType?: string;
    tokens?: string[];
    tokenHolder?: string;
    bptIndex?: number;
    hasNestedPool?: boolean;
    swap?: Swap;
}

export interface Method {
    type: string;
    target: string;
    coins: string[];
}

export interface Swap {
    blockProviders: string[];
}

export interface LendingOracle {
    provider: string;
    address?: string;
}

export interface Bridged {
    optimism: string;
    base: string;
}
