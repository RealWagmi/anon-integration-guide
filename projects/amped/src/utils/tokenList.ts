import { type Address } from 'viem';
import { CONTRACT_ADDRESSES, NETWORKS } from '../constants.js';

/**
 * Supported token symbols across all supported chains
 * This is based on the tokens available in the HeyAnon token list
 */
export type TokenSymbol = 
    // Sonic chain 
    | 'S'       // Sonic native token - Implicit, not in token list
    | 'WS'      // Wrapped Sonic
    | 'WETH'    // Wrapped Ethereum
    | 'Anon'    // Anon token (note the capitalization)
    | 'ANON'    // Alias for Anon with different capitalization
    | 'USDC'    // USD Coin
    | 'scUSD'   // Sonic USD
    | 'STS'     // Sonic Test Stablecoin (matches our constants but not in token list)
    // Base chain
    | 'ETH'     // Ethereum (Base native token) - Implicit, not in token list
    | 'CBBTC'   // Coinbase BTC
    | 'VIRTUAL'; // Virtual USD

/**
 * Token data mapped from the HeyAnon token list or constants
 */
interface TokenData {
    address: Address;
    decimals: number;
    name?: string;
    symbol: TokenSymbol;
}

/**
 * Maps from token symbol to token data for each supported chain
 * Using Partial<Record> to allow for partial token support on each chain
 */
const TOKEN_MAP: Record<string, Partial<Record<TokenSymbol, TokenData>>> = {
    sonic: {
        // From token list
        'WS': { 
            symbol: 'WS',
            address: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38' as Address,
            decimals: 18
        },
        'WETH': { 
            symbol: 'WETH',
            address: '0x50c42dEAcD8Fc9773493ED674b675bE577f2634b' as Address,
            decimals: 18
        },
        'Anon': { 
            symbol: 'Anon',
            address: '0x79bbF4508B1391af3A0F4B30bb5FC4aa9ab0E07C' as Address,
            decimals: 18
        },
        'ANON': { 
            symbol: 'Anon',
            address: '0x79bbF4508B1391af3A0F4B30bb5FC4aa9ab0E07C' as Address,
            decimals: 18
        },
        'USDC': { 
            symbol: 'USDC',
            address: '0x29219dd400f2Bf60E5a23d13Be72B486D4038894' as Address,
            decimals: 6
        },
        'scUSD': { 
            symbol: 'scUSD',
            address: '0xd3DCe716f3eF535C5Ff8d041c1A41C3bd89b97aE' as Address,
            decimals: 6
        },
        // From constants (not in token list)
        'S': { 
            symbol: 'S',
            address: CONTRACT_ADDRESSES.sonic.NATIVE_TOKEN,
            decimals: 18
        },
        'STS': { 
            symbol: 'STS',
            address: CONTRACT_ADDRESSES.sonic.STS,
            decimals: 18
        }
    },
    base: {
        // Base tokens
        'ETH': { 
            symbol: 'ETH',
            address: CONTRACT_ADDRESSES.base.NATIVE_TOKEN,
            decimals: 18
        },
        'WETH': { 
            symbol: 'WETH',
            address: CONTRACT_ADDRESSES.base.WRAPPED_NATIVE_TOKEN,
            decimals: 18
        },
        'USDC': { 
            symbol: 'USDC',
            address: CONTRACT_ADDRESSES.base.USDC,
            decimals: 6
        },
        'CBBTC': { 
            symbol: 'CBBTC',
            address: CONTRACT_ADDRESSES.base.CBBTC || '0x0000000000000000000000000000000000000000' as Address,
            decimals: 18
        },
        'VIRTUAL': { 
            symbol: 'VIRTUAL',
            address: CONTRACT_ADDRESSES.base.VIRTUAL || '0x0000000000000000000000000000000000000000' as Address,
            decimals: 18
        }
    }
};

/**
 * Gets the contract address for a token symbol on a specific chain
 * @param symbol - Token symbol to look up
 * @param chainName - The chain name (e.g., "sonic", "base")
 * @returns The token's contract address
 */
export function getTokenAddress(symbol: TokenSymbol, chainName: string): Address {
    const networkName = chainName.toLowerCase();
    const chainTokens = TOKEN_MAP[networkName];
    
    if (!chainTokens) {
        throw new Error(`Unsupported chain: ${chainName}`);
    }

    // Special case handling for symbol aliases 
    let lookupSymbol = symbol;

    // Handle special case for ANON/Anon capitalization differences
    if (symbol === 'ANON') {
        lookupSymbol = 'Anon' as TokenSymbol;
    }
    
    const tokenData = chainTokens[lookupSymbol];
    if (!tokenData) {
        throw new Error(`Token ${symbol} not supported on ${chainName}`);
    }
    
    return tokenData.address;
}

/**
 * Gets the token decimals for a token symbol on a specific chain
 * @param symbol - Token symbol to look up
 * @param chainName - The chain name (e.g., "sonic", "base")
 * @returns The number of decimals for the token
 */
export function getTokenDecimals(symbol: TokenSymbol, chainName: string): number {
    const networkName = chainName.toLowerCase();
    const chainTokens = TOKEN_MAP[networkName];
    
    if (!chainTokens) {
        // Default decimals if chain not found
        return symbol === 'USDC' || symbol === 'scUSD' ? 6 : 18;
    }

    // Special case handling for symbol aliases
    let lookupSymbol = symbol;

    // Handle special case for ANON/Anon capitalization differences
    if (symbol === 'ANON') {
        lookupSymbol = 'Anon' as TokenSymbol;
    }
    
    const tokenData = chainTokens[lookupSymbol];
    if (!tokenData) {
        // Default decimals if token not found
        return symbol === 'USDC' || symbol === 'scUSD' ? 6 : 18;
    }
    
    return tokenData.decimals;
}

/**
 * Gets the token symbol for an address (reverse lookup)
 * @param address - Token address to look up
 * @param chainName - The chain name (e.g., "sonic", "base")
 * @returns The token symbol or undefined if not found
 */
export function getTokenSymbol(address: Address, chainName: string): TokenSymbol | undefined {
    const networkName = chainName.toLowerCase();
    const chainTokens = TOKEN_MAP[networkName];
    
    if (!chainTokens) {
        return undefined;
    }
    
    // Normalize addresses for comparison
    const normalizedAddress = address.toLowerCase();
    
    // Find matching token by address
    for (const [symbol, data] of Object.entries(chainTokens)) {
        if (data.address.toLowerCase() === normalizedAddress) {
            return data.symbol;
        }
    }
    
    return undefined;
}

/**
 * Gets all supported tokens for a specific chain
 * @param chainName - The chain name (e.g., "sonic", "base")
 * @returns Array of token data objects
 */
export function getSupportedTokens(chainName: string): TokenData[] {
    const networkName = chainName.toLowerCase();
    const chainTokens = TOKEN_MAP[networkName];
    
    if (!chainTokens) {
        return [];
    }
    
    return Object.values(chainTokens);
}

/**
 * Checks if a token is supported on a specific chain
 * @param symbol - Token symbol to check
 * @param chainName - The chain name (e.g., "sonic", "base")
 * @returns True if the token is supported
 */
export function isTokenSupported(symbol: string, chainName: string): boolean {
    const networkName = chainName.toLowerCase();
    const chainTokens = TOKEN_MAP[networkName];
    
    if (!chainTokens) {
        return false;
    }
    
    // Special case handling for symbol aliases
    let lookupSymbol = symbol;

    // Handle special case for ANON/Anon capitalization differences
    if (symbol === 'ANON') {
        lookupSymbol = 'Anon';
    }
    
    return !!chainTokens[lookupSymbol as TokenSymbol];
} 