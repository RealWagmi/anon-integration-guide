import { Address } from 'viem';
import { NETWORKS } from '../../constants.js';

/**
 * Base properties for liquidity operations
 * @property {string} chainName - The name of the chain to operate on
 * @property {Address} account - The user's account address
 * @property {string} amount - The amount to process
 */
export interface BaseLiquidityProps {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
    account: Address;
    amount: string;
}

/**
 * Properties for adding liquidity to the GLP pool
 * @extends {BaseLiquidityProps}
 * @property {Address} tokenIn - The token address to provide as liquidity
 * @property {string} [minOut] - The minimum amount of GLP to receive (optional, will be calculated if not provided)
 */
export interface AddLiquidityProps extends BaseLiquidityProps {
    tokenIn: Address;
    minOut?: string;
}

/**
 * Properties for removing liquidity from the GLP pool
 * @extends {BaseLiquidityProps}
 * @property {Address} tokenOut - The token address to receive when removing liquidity
 * @property {string} minOut - The minimum amount to receive when removing liquidity
 */
export interface RemoveLiquidityProps extends BaseLiquidityProps {
    tokenOut: Address;
    minOut: string;
}
