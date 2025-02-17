import { CHAIN_IDS, CONTRACT_ADDRESSES, NETWORKS } from './constants.js';
import { type Address } from 'viem';

// Define supported token symbols
export type SupportedToken = 'S' | 'WS' | 'WETH' | 'ANON' | 'USDC' | 'EURC';

// Helper function to get token address
export function getTokenAddress(symbol: SupportedToken): Address {
    switch (symbol) {
        case 'S':
            return CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN;
        case 'WS':
            return CONTRACT_ADDRESSES[NETWORKS.SONIC].WRAPPED_NATIVE_TOKEN;
        case 'WETH':
            return CONTRACT_ADDRESSES[NETWORKS.SONIC].WETH;
        case 'ANON':
            return CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON;
        case 'USDC':
            return CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC;
        case 'EURC':
            return CONTRACT_ADDRESSES[NETWORKS.SONIC].EURC;
        default:
            throw new Error(`Unsupported token symbol: ${symbol}`);
    }
}

// Helper function to get native token address
export function getNativeTokenAddress(): Address {
    return CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN;
}

// Safe type conversion helpers
export function safeToString(value: unknown): string {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') {
        return value.toString();
    }
    return '';
}

export function safeToNumber(value: unknown): number {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    if (typeof value === 'bigint') {
        // Safely convert bigint to number, return 0 if too large
        try {
            return Number(value);
        } catch {
            return 0;
        }
    }
    return 0;
}

export function getChainFromName(chainName: string): number | null {
    if (chainName in CHAIN_IDS) {
        return CHAIN_IDS[chainName as keyof typeof CHAIN_IDS];
    }
    return null;
} 