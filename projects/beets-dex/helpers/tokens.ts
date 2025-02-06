import { Address } from 'viem';
import { GqlToken } from './beets/types';
import { Token as BalancerToken } from '@balancer/sdk';
import { BeetsClient } from './beets/client';
import { anonChainNameToGqlChain } from './chains';
import { TOKEN_SYNONYMS } from '../constants';
import { getChainFromName } from '@heyanon/sdk';

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
export async function getTokenBySymbol(chainName: string, symbol: string, acceptSynonyms = false): Promise<BalancerToken | null> {
    const client = new BeetsClient();
    const allTokens = await client.getTokens([anonChainNameToGqlChain(chainName)]);
    const chainId = getChainFromName(chainName);
    if (acceptSynonyms) {
        const synonyms = TOKEN_SYNONYMS[chainId as keyof typeof TOKEN_SYNONYMS];
        if (synonyms) {
            const synonym = synonyms[symbol as keyof typeof synonyms];
            if (synonym) {
                symbol = synonym;
            }
        }
    }

    const token = allTokens.find(token => token.symbol.toLowerCase() === symbol.toLowerCase());
    if (!token) return null;

    return gqlTokenToBalancerToken(token);
} 