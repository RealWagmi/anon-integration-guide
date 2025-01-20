import { Address } from 'viem';

/**
 * Configuration for a supported network
 * @property {Address} glpManager - The GLP manager contract address
 * @property {Address} glpToken - The GLP token contract address
 * @property {string} rpcUrl - The RPC URL for the network
 * @property {number} chainId - The chain ID for the network
 */
export interface NetworkConfig {
    glpManager: Address;
    glpToken: Address;
    rpcUrl: string;
    chainId: number;
}

/**
 * Configuration for all supported networks
 */
export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
    sonic: {
        glpManager: '0x3963FfC9dff443c2A94f21b129D429891E32ec18',
        glpToken: '0x4277f8F2c384827B5273592FF7CeBd9f2C1ac258',
        rpcUrl: process.env.SONIC_RPC_URL || '',
        chainId: 146,
    },
    // Add other networks as needed
};

/**
 * Base properties for liquidity operations
 * @property {string} chainName - The name of the chain to operate on
 * @property {Address} account - The user's account address
 * @property {string} amount - The amount to process
 * @property {string} minOut - The minimum amount to receive
 */
export interface BaseLiquidityProps {
    chainName: string;
    account: Address;
    amount: string;
    minOut: string;
}

/**
 * Properties for adding liquidity to the GLP pool
 * @extends {BaseLiquidityProps}
 * @property {Address} tokenIn - The token address to provide as liquidity
 */
export interface AddLiquidityProps extends BaseLiquidityProps {
    tokenIn: Address;
}

/**
 * Properties for removing liquidity from the GLP pool
 * @extends {BaseLiquidityProps}
 * @property {Address} tokenOut - The token address to receive when removing liquidity
 */
export interface RemoveLiquidityProps extends BaseLiquidityProps {
    tokenOut: Address;
} 