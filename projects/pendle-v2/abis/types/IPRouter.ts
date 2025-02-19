export interface IPRouter {
    initialize(
        factory: string,
        WETH: string
    ): Promise<void>;

    addLiquidityETH(
        token: string,
        amountTokenDesired: bigint,
        amountTokenMin: bigint,
        amountETHMin: bigint,
        to: string,
        deadline: number
    ): Promise<{
        amountToken: bigint;
        amountETH: bigint;
        liquidity: bigint;
    }>;

    removeLiquidityETH(
        token: string,
        liquidity: bigint,
        amountTokenMin: bigint,
        amountETHMin: bigint,
        to: string,
        deadline: number
    ): Promise<{
        amountToken: bigint;
        amountETH: bigint;
    }>;

    swapExactTokensForTokens(
        amountIn: bigint,
        amountOutMin: bigint,
        path: string[],
        to: string,
        deadline: number
    ): Promise<{
        amounts: bigint[];
    }>;

    swapTokensForExactTokens(
        amountOut: bigint,
        amountInMax: bigint,
        path: string[],
        to: string,
        deadline: number
    ): Promise<{
        amounts: bigint[];
    }>;
} 