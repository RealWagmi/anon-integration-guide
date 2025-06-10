/**
 * Token utilities using the SDK's token lists
 */

import { type Address, getAddress } from 'viem';
import { sonicTokens, baseTokens, Token } from '@real-wagmi/sdk';
import { EVM } from '@heyanon/sdk';

const { NATIVE_ADDRESS } = EVM.constants;

// Map our token symbols to SDK token keys
const SONIC_TOKEN_MAP: Record<string, string> = {
    'S': 'native',      // Native Sonic
    'WS': 'ws',         // Wrapped Sonic
    'WETH': 'weth',     // Wrapped ETH on Sonic
    'USDC': 'usdce',    // USDC.e on Sonic (SDK key)
    'Anon': 'custom',   // Not in SDK, use custom
    'scUSD': 'custom',  // Not in SDK, use custom
    'STS': 'custom',    // Not in SDK, use custom
};

const BASE_TOKEN_MAP: Record<string, string> = {
    'ETH': 'native',    // Native ETH
    'WETH': 'weth',     // Wrapped ETH on Base
    'USDC': 'usdc',     // USDC on Base
    'CBBTC': 'cbbtc',   // If available in SDK
    'VIRTUAL': 'virtual', // If available in SDK
};

// Custom tokens not in SDK (fallback) - all addresses are checksummed
const CUSTOM_TOKENS: Record<string, Record<string, { address: Address; decimals: number }>> = {
    sonic: {
        'Anon': { address: getAddress('0x79bbF4508B1391af3A0F4B30bb5FC4aa9ab0E07C'), decimals: 18 },
        'scUSD': { address: getAddress('0xd3DCe716f3eF535C5Ff8d041c1A41C3bd89b97aE'), decimals: 6 },
        'STS': { address: getAddress('0xe5da20f15420ad15de0fa650600afc998bbe3955'), decimals: 18 }, // Beets Staked Sonic
    },
    base: {
        'CBBTC': { address: getAddress('0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf'), decimals: 8 },
        'VIRTUAL': { address: getAddress('0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b'), decimals: 18 },
    }
};

/**
 * Get token info from SDK or fallback
 */
export function getTokenFromSDK(symbol: string, chainName: string): { address: Address; decimals: number; symbol: string } | null {
    const network = chainName.toLowerCase();
    
    // Handle native tokens
    if ((network === 'sonic' && symbol === 'S') || (network === 'base' && symbol === 'ETH')) {
        return {
            address: NATIVE_ADDRESS as Address,
            decimals: 18,
            symbol
        };
    }
    
    // Get SDK token map for the chain
    const tokenMap = network === 'sonic' ? SONIC_TOKEN_MAP : BASE_TOKEN_MAP;
    const sdkTokens = network === 'sonic' ? sonicTokens : baseTokens;
    const sdkKey = tokenMap[symbol];
    
    if (sdkKey && sdkKey !== 'native' && sdkTokens[sdkKey]) {
        const token = sdkTokens[sdkKey] as Token;
        return {
            address: token.address as Address,
            decimals: token.decimals,
            symbol: token.symbol
        };
    }
    
    // Fallback to custom tokens
    const customToken = CUSTOM_TOKENS[network]?.[symbol];
    if (customToken) {
        return {
            ...customToken,
            symbol
        };
    }
    
    return null;
}

/**
 * Get all supported tokens for a chain
 */
export function getChainTokens(chainName: string): string[] {
    const network = chainName.toLowerCase();
    if (network === 'sonic') {
        return Object.keys(SONIC_TOKEN_MAP);
    } else if (network === 'base') {
        return Object.keys(BASE_TOKEN_MAP);
    }
    return [];
}

/**
 * Check if a token is supported on a chain
 */
export function isTokenSupportedOnChain(symbol: string, chainName: string): boolean {
    return getTokenFromSDK(symbol, chainName) !== null;
}