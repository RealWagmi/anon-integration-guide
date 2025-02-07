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
    return new BalancerToken(token.chainId, token.address as Address, token.decimals, token.symbol, token.name);
}

/**
 * Get a token by its case-insensitive symbol, returning null
 * if the token is not found.
 *
 * If acceptSynonyms is true, the function will also accept
 * synonyms of the token symbol, and not just the exact symbol.
 */
export async function getTokenBySymbol(chainName: string, symbol: string, acceptSynonyms = false): Promise<GqlToken | null> {
    const client = new BeetsClient();
    const gqlChain = anonChainNameToGqlChain(chainName);
    if (!gqlChain) {
        throw new Error(`Chain ${chainName} not supported by Beets backend`);
    }
    const allTokens = await client.getTokens([gqlChain]);
    const chainId = getChainFromName(chainName);
    if (acceptSynonyms) {
        const synonyms = TOKEN_SYNONYMS[chainId as keyof typeof TOKEN_SYNONYMS];
        if (synonyms) {
            const synonym = synonyms[symbol.toUpperCase() as keyof typeof synonyms];
            if (synonym) {
                symbol = synonym;
            }
        }
    }

    const token = allTokens.find((token) => token.symbol.toLowerCase() === symbol.toLowerCase());
    if (!token) return null;

    return token;
}

/**
 * Get a GrahQL Token by its case-insensitive address, returning null
 * if the token is not found
 */
export async function getGqlTokenByAddress(chainName: string, address: Address): Promise<GqlToken | null> {
    const client = new BeetsClient();
    const gqlChain = anonChainNameToGqlChain(chainName);
    if (!gqlChain) {
        throw new Error(`Chain ${chainName} not supported by Beets backend`);
    }
    const allTokens = await client.getTokens([gqlChain]);
    const token = allTokens.find((token) => token.address.toLowerCase() === address.toLowerCase());
    if (!token) return null;
    return token;
}

/**
 * Get a Balancer SDK Token by its case-insensitive address, returning null
 * if the token is not found
 */
export async function getBalancerTokenByAddress(chainName: string, address: Address): Promise<BalancerToken | null> {
    const gqlToken = await getGqlTokenByAddress(chainName, address);
    if (!gqlToken) return null;
    return gqlTokenToBalancerToken(gqlToken);
}
