import { type Address } from 'viem';
import { CONTRACT_ADDRESSES } from '../constants.js';
import { getChainFromName } from '../utils.js';
import { getTokenFromSDK } from './sdkTokens.js';

/**
 * Supported token symbols across all supported chains
 */
export type TokenSymbol = 
    | 'S'       // Sonic native token
    | 'WS'      // Wrapped Sonic
    | 'WETH'    // Wrapped Ethereum
    | 'ANON'    // Anon token
    | 'USDC'    // USD Coin
    | 'STS'     // Sonic Test Stablecoin
    | 'scUSD'   // Sonic USD
    | 'ETH'     // Ethereum (Base)
    | 'CBBTC'   // Coinbase BTC
    | 'VIRTUAL'; // Virtual USD

/**
 * Gets the contract address for a token symbol on a specific chain
 * @param symbol - Token symbol to look up
 * @param chainName - The chain name (e.g., "sonic", "base")
 * @returns The token's contract address
 */
export function getTokenAddress(symbol: TokenSymbol, chainName: string): Address {
    const networkName = chainName.toLowerCase();
    const chainId = getChainFromName(networkName);
    if (!chainId) {
        throw new Error(`Unsupported network: ${networkName}`);
    }
    const contracts = CONTRACT_ADDRESSES[chainId];
    
    if (!contracts) {
        throw new Error(`Contract addresses not found for network: ${networkName}`);
    }
    
    // Special handling for native and wrapped native tokens
    if (symbol === 'S' || (symbol === 'ETH' && networkName === 'base')) {
        return contracts.NATIVE_TOKEN;
    }
    if (symbol === 'WS' || (symbol === 'WETH' && networkName === 'base')) {
        return contracts.WRAPPED_NATIVE_TOKEN;
    }
    
    // For other tokens, use SDK
    const tokenInfo = getTokenFromSDK(symbol, chainName);
    if (tokenInfo) {
        return tokenInfo.address;
    }
    
    throw new Error(`Unsupported token symbol: ${symbol} on ${chainName}`);
}

/**
 * Gets the token decimals for a token symbol
 * @param symbol - Token symbol to look up
 * @returns The number of decimals for the token
 */
export function getTokenDecimals(symbol: TokenSymbol): number {
    switch (symbol) {
        case 'USDC':
        case 'scUSD':
            return 6;
        case 'CBBTC':
            return 8;
        case 'S':
        case 'WS':
        case 'WETH':
        case 'ANON':
        case 'STS':
        case 'ETH':
        case 'VIRTUAL':
            return 18;
        default:
            return 18;
    }
}

/**
 * Gets the token symbol for an address (reverse lookup)
 * @param address - Token address to look up
 * @param chainName - The chain name (e.g., "sonic", "base")
 * @returns The token symbol or undefined if not found
 */
export function getTokenSymbol(address: Address, chainName: string): TokenSymbol | undefined {
    const networkName = chainName.toLowerCase();
    const chainId = getChainFromName(networkName);
    if (!chainId) {
        return undefined;
    }
    const contracts = CONTRACT_ADDRESSES[chainId];
    
    if (!contracts) {
        return undefined;
    }
    
    // Normalize addresses for comparison
    const normalizedAddress = address.toLowerCase();
    
    // Check native and wrapped native tokens first
    if (normalizedAddress === contracts.NATIVE_TOKEN.toLowerCase()) {
        return networkName === 'sonic' ? 'S' : 'ETH';
    }
    if (normalizedAddress === contracts.WRAPPED_NATIVE_TOKEN.toLowerCase()) {
        return networkName === 'sonic' ? 'WS' : 'WETH';
    }
    
    // Try all supported tokens using SDK
    const supportedTokens: TokenSymbol[] = ['WETH', 'ANON', 'USDC', 'STS', 'scUSD', 'CBBTC', 'VIRTUAL'];
    for (const symbol of supportedTokens) {
        try {
            const tokenInfo = getTokenFromSDK(symbol, chainName);
            if (tokenInfo && normalizedAddress === tokenInfo.address.toLowerCase()) {
                return symbol;
            }
        } catch {
            // Skip tokens not available on this chain
            continue;
        }
    }
    
    return undefined;
} 