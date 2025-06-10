import { type Address } from 'viem';
import { getTokenFromSDK, getChainTokens, isTokenSupportedOnChain } from './sdkTokens.js';

/**
 * Supported token symbols across all supported chains
 * This is based on the tokens available in the SDK and custom additions
 */
export type TokenSymbol = 
    // Sonic chain 
    | 'S'       // Sonic native token
    | 'WS'      // Wrapped Sonic  
    | 'WETH'    // Wrapped Ether on Sonic
    | 'Anon'    // Anon token
    | 'USDC'    // USDC on Sonic
    | 'scUSD'   // Savings-compatible USD
    | 'STS'     // Beets Staked Sonic
    // Base chain
    | 'ETH'     // ETH native token
    | 'CBBTC'   // Coinbase Wrapped BTC
    | 'VIRTUAL'; // Virtual Protocol token

/**
 * Gets the contract address for a token symbol on a specific chain
 * @param symbol - Token symbol to look up
 * @param chainName - The chain name (e.g., "sonic", "base")
 * @returns The token's contract address
 */
export function getTokenAddress(symbol: TokenSymbol, chainName: string): Address {
    const tokenInfo = getTokenFromSDK(symbol, chainName);
    
    if (!tokenInfo) {
        throw new Error(`Token ${symbol} not supported on ${chainName}`);
    }
    
    return tokenInfo.address;
}

/**
 * Gets the token decimals for a token symbol on a specific chain
 * @param symbol - Token symbol to look up
 * @param chainName - The chain name (e.g., "sonic", "base")
 * @returns The number of decimals for the token
 */
export function getTokenDecimals(symbol: TokenSymbol, chainName: string): number {
    const tokenInfo = getTokenFromSDK(symbol, chainName);
    
    if (!tokenInfo) {
        // Default decimals if token not found
        return symbol === 'USDC' || symbol === 'scUSD' ? 6 : 18;
    }
    
    return tokenInfo.decimals;
}

/**
 * Gets the token symbol from an address on a specific chain
 * @param address - Token contract address
 * @param chainName - The chain name (e.g., "sonic", "base") 
 * @returns The token symbol or null if not found
 */
export function getTokenSymbol(address: Address, chainName: string): TokenSymbol | null {
    const tokens = getChainTokens(chainName);
    
    for (const symbol of tokens) {
        const tokenInfo = getTokenFromSDK(symbol, chainName);
        if (tokenInfo && tokenInfo.address.toLowerCase() === address.toLowerCase()) {
            return symbol as TokenSymbol;
        }
    }
    
    return null;
}

/**
 * Gets all supported tokens for a specific chain
 * @param chainName - The chain name (e.g., "sonic", "base")
 * @returns Array of supported token symbols
 */
export function getSupportedTokens(chainName: string): TokenSymbol[] {
    return getChainTokens(chainName) as TokenSymbol[];
}

/**
 * Checks if a token is supported on a specific chain
 * @param symbol - Token symbol to check
 * @param chainName - The chain name (e.g., "sonic", "base")
 * @returns Whether the token is supported
 */
export function isTokenSupported(symbol: string, chainName: string): boolean {
    return isTokenSupportedOnChain(symbol, chainName);
}