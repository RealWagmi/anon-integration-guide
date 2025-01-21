export interface IPMarket {
    addLiquidity(
        receiver: string,
        tokenIn: string[],
        netTokenIn: bigint[],
        minLpOut: bigint
    ): Promise<{ lpOut: bigint }>;

    removeLiquidity(
        receiver: string,
        netLpToRemove: bigint,
        minTokenOut: bigint[],
        tokenOut: string[]
    ): Promise<{ tokenAmountOut: bigint[] }>;

    redeemRewards(): Promise<void>;

    isExpired(): Promise<boolean>;
} 