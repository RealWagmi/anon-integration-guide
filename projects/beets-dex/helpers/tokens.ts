import { Address } from 'viem';
import { WHITELISTED_TOKENS, WhitelistedToken } from '../constants/tokens';
import { GqlToken } from './beets/types';
import { Token as BalancerToken } from '@balancer/sdk';
import { BeetsClient } from './beets/client';
import { anonChainNameToGqlChain } from './chains';

/**
 * Convert a Token from the GraphQL endpoint into a Token from
 * the Balancer SDK.
 */
export function gqlTokenToBalancerToken(token: GqlToken): BalancerToken {
    return new BalancerToken(
        token.chainId,
        token.address as Address,
        token.decimals,
        token.symbol,
        token.name
    );   
}

/**
 * Get a token's address by its case-insensitive symbol, returning null
 * if the token is not found
 */
export async function getTokenBySymbol(chainName: string, symbol: string): Promise<BalancerToken | null> {
    const client = new BeetsClient();
    const tokens = await client.getTokens([anonChainNameToGqlChain(chainName)]);

    const token = tokens.find(token => token.symbol.toLowerCase() === symbol.toLowerCase());
    if (!token) return null;

    return gqlTokenToBalancerToken(token);
} 