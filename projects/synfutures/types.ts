import { Address, PublicClient, Chain } from "viem";

// SDK Types
export interface FunctionReturn {
    success: boolean;
    data: any;
}

export interface TransactionParams {
    target: `0x${string}`;
    data: `0x${string}`;
    value?: string;
}

export interface TransactionReturnData {
    hash: `0x${string}`;
    message: string;
}

export interface TransactionReturn {
    success: boolean;
    data: TransactionReturnData[];
}

export interface FunctionOptions {
    getProvider: (chainId: number) => PublicClient;
    sendTransactions: (params: {
        chainId: number;
        account: `0x${string}`;
        transactions: TransactionParams[];
    }) => Promise<TransactionReturn>;
    notify?: (message: string) => Promise<void>;
}

// Order Types
export type OrderSide = "BUY" | "SELL";
export type PositionSide = "LONG" | "SHORT";
export type TimeInForce = "GTC" | "IOC" | "FOK";
export type AdjustmentStrategy = "SHIFT" | "WIDEN" | "NARROW";

export interface MarketOrder {
    pair: string;
    side: OrderSide;
    amount: string;
    slippage: number;
}

export interface LimitOrder {
    pair: string;
    side: OrderSide;
    amount: string;
    price: string;
    postOnly?: boolean;
    timeInForce?: TimeInForce;
}

export interface PositionOrder {
    pair: string;
    side: PositionSide;
    leverage: string;
    margin: string;
    stopLoss?: string;
    takeProfit?: string;
    trailingStop?: string;
}

// Liquidity Types
export interface LiquidityParams {
    pair: string;
    amount: string;
    lowerTick: number;
    upperTick: number;
    useAutoRange?: boolean;
    dynamicFeeThreshold?: string;
}

export interface RemoveLiquidityParams {
    positionId: string;
    percentage: number;
    collectFees?: boolean;
    minAmountOut?: string;
}

export interface AdjustRangeParams {
    positionId: string;
    newLowerTick: number;
    newUpperTick: number;
    adjustmentStrategy?: AdjustmentStrategy;
    rebalanceTokens?: boolean;
}

export interface ClaimFeesParams {
    positionId: string;
    reinvest?: boolean;
    claimAll?: boolean;
}

// Client Interface
export interface OysterClient {
    createMarketOrder: (order: MarketOrder) => Promise<{ tx: { data: string; value?: string } }>;
    createLimitOrder: (order: LimitOrder) => Promise<{ tx: { data: string; value?: string } }>;
    createPosition: (order: PositionOrder) => Promise<{ tx: { data: string; value?: string } }>;
    addLiquidity: (params: LiquidityParams) => Promise<{ tx: { data: string; value?: string } }>;
    removeLiquidity: (params: RemoveLiquidityParams) => Promise<{ tx: { data: string; value?: string } }>;
    adjustLiquidityRange: (params: AdjustRangeParams) => Promise<{ tx: { data: string; value?: string } }>;
    claimFees: (params: ClaimFeesParams) => Promise<{ tx: { data: string; value?: string } }>;
} 