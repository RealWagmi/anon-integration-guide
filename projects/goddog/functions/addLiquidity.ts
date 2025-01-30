import { LiquidityParams, FunctionReturn } from './types';
import { HeyAnonSDK } from '@heyanon/sdk';

export async function addLiquidityOnUniswapV3(
    params: LiquidityParams,
    sdk: HeyAnonSDK
): Promise<FunctionReturn> {
    try {
        const { account, tokenAddress, tokenAmount, chainId } = params;
        
        // Add liquidity to Uniswap V3 pool
        const tx = await sdk.uniswapV3.addLiquidity({
            account,
            tokenIn: tokenAddress,
            amountIn: tokenAmount,
            chainId
        });

        return {
            message: `Successfully added ${tokenAmount} tokens to Uniswap V3 pool`,
            error: false
        };
    } catch (error) {
        return {
            message: `Failed to add liquidity: ${error.message}`,
            error: true
        };
    }
} 