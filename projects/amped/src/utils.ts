import { CHAIN_IDS, CONTRACT_ADDRESSES, NETWORKS, SupportedNetwork } from './constants.js';
import { type Address } from 'viem';

// Define supported token symbols across all networks
export type SupportedToken =
    // Sonic
    | 'S'
    | 'WS'
    | 'WETH' // Note: WETH exists on both, but might have different addresses
    | 'ANON'
    | 'USDC' // Note: USDC exists on both, but might have different addresses
    // Removed EURC
    // Base
    | 'ETH' // Base native token
    // WETH already included
    // USDC already included
    | 'CBBTC'
    | 'VIRTUAL';

// Helper function to get token address for a specific network
export function getTokenAddress(symbol: SupportedToken, network: SupportedNetwork): Address {
    const networkAddresses = CONTRACT_ADDRESSES[network.toLowerCase()]; // Use lowercase network key
    if (!networkAddresses) {
        throw new Error(`Unsupported network: ${network}`);
    }

    let address: Address | undefined;

    // Handle native token symbols explicitly
    if ((network === NETWORKS.SONIC && symbol === 'S') || (network === NETWORKS.BASE && symbol === 'ETH')) {
        address = networkAddresses.NATIVE_TOKEN;
    } else {
        // Map symbols to contract keys (case-insensitive matching for flexibility)
        const upperSymbol = symbol.toUpperCase();
        switch (upperSymbol) {
            case 'WS':
                address = networkAddresses.WRAPPED_NATIVE_TOKEN; // Sonic specific
                break;
            case 'WETH':
                // Use WRAPPED_NATIVE_TOKEN on Base, WETH on Sonic (based on constants setup)
                address = network === NETWORKS.BASE ? networkAddresses.WRAPPED_NATIVE_TOKEN : networkAddresses.WETH;
                break;
            case 'ANON':
                address = networkAddresses.ANON; // Sonic specific
                break;
            case 'USDC':
                address = networkAddresses.USDC;
                break;
            // Removed EURC case
            case 'CBBTC':
                address = networkAddresses.CBBTC; // Base specific
                break;
            case 'VIRTUAL': 
                address = networkAddresses.VIRTUAL; // Base specific
                break;
        }
    }

    if (!address) {
        throw new Error(`Unsupported token symbol "${symbol}" for network "${network}"`);
    }
    return address;
}

// Helper function to get native token address for a specific network
export function getNativeTokenAddress(network: SupportedNetwork): Address {
    const networkAddresses = CONTRACT_ADDRESSES[network];
    if (!networkAddresses || !networkAddresses.NATIVE_TOKEN) {
        throw new Error(`Native token address not found for network: ${network}`);
    }
    return networkAddresses.NATIVE_TOKEN;
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

// Helper function to get chain ID from network name
export function getChainFromName(name: string): number | undefined {
    const lowerName = name.toLowerCase();
    if (lowerName === NETWORKS.SONIC) {
        return CHAIN_IDS.sonic;
    }
    if (lowerName === NETWORKS.BASE) {
        return CHAIN_IDS.base;
    }
    return undefined;
}

// Helper function to get network name from chain ID
export function getNetworkNameFromChainId(chainId: number): SupportedNetwork | undefined {
    if (chainId === CHAIN_IDS.sonic) {
        return NETWORKS.SONIC;
    }
    if (chainId === CHAIN_IDS.base) {
        return NETWORKS.BASE;
    }
    return undefined;
} 