import { Address } from 'viem';
import { WHITELISTED_TOKENS, WhitelistedToken } from '../constants/tokens';

/**
 * Find a token by its symbol in the whitelist for a given chain
 */
export function findTokenBySymbol(chainName: string, symbol: string): WhitelistedToken | null {
    const chainTokens = WHITELISTED_TOKENS[chainName.toUpperCase()];
    if (!chainTokens) return null;

    return chainTokens.find(token => 
        token.symbol.toLowerCase() === symbol.toLowerCase()
    ) || null;
}

/**
 * Get a token's address by its symbol, with validation
 */
export function getTokenAddressBySymbol(chainName: string, symbol: string): Address | null {
    const token = findTokenBySymbol(chainName, symbol);
    return token?.address || null;
} 