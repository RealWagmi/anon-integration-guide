import { Address } from 'viem';

export interface FunctionReturn {
    message: string;
    error?: boolean;
}

export interface VaultParams {
    account: Address;
    vaultAddress: Address;
    poolAddress: Address;
    agentAddress: Address;
    chainId: number;
}

export interface LiquidityParams {
    account: Address;
    tokenAddress: Address;
    tokenAmount: string;
    chainId: number;
} 