import { Address, formatUnits, decodeEventLog, Log, TransactionReceipt, erc20Abi } from 'viem';
import { GqlToken } from './beets/types';
import { Token as BalancerToken, NATIVE_ASSETS } from '@balancer/sdk';
import { BeetsClient } from './beets/client';
import { anonChainNameToGqlChain } from './chains';
import { DEFAULT_PRECISION, EQUIVALENT_TOKENS, NATIVE_TOKEN_ADDRESS, TOKEN_SYNONYMS } from '../constants';
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
export async function getGqlTokenBySymbol(chainName: string, symbol: string, acceptSynonyms = false): Promise<GqlToken | null> {
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

/**
 * Get a Balancer SDK Token by its case-insensitive symbol, returning null
 * if the token is not found
 */
export async function getBalancerTokenBySymbol(chainName: string, symbol: string): Promise<BalancerToken | null> {
    const gqlToken = await getGqlTokenBySymbol(chainName, symbol);
    if (!gqlToken) return null;
    return gqlTokenToBalancerToken(gqlToken);
}

/**
 * Convert a token amount to a human-readable string, with a
 * specified number of significant digits.
 *
 * Please note that Balancer SDK's TokenAmount.toSignificant
 * yields a different result, as it uses a fixed number of
 * DECIMAL digits, while this function really does significant
 * digits (just like %g formatter in printf).
 */
export function toHumanReadableAmount(
    amountInWei: bigint,
    decimals: number,
    minSignificantDigits = 2,
    maxSignificantDigits = DEFAULT_PRECISION,
    useThousandsSeparator = true,
): string {
    const stringWithFullPrecision = formatUnits(amountInWei, decimals);
    return toSignificant(Number(stringWithFullPrecision), minSignificantDigits, maxSignificantDigits, useThousandsSeparator);
}

/**
 * Format a number to a string with the given number of significant
 * digits, using a thousands separator if specified.
 */
export function toSignificant(
    num: number,
    minSignificantDigits: number | undefined = undefined,
    maxSignificantDigits: number | undefined = DEFAULT_PRECISION,
    useThousandsSeparator = true,
): string {
    return num.toLocaleString('en', {
        minimumSignificantDigits: minSignificantDigits,
        maximumSignificantDigits: maxSignificantDigits,
        useGrouping: useThousandsSeparator,
        notation: 'standard', // Ensures we don't get scientific notation
    });
}

/**
 * Format a number representing a dollar value to a string.  By default,
 * it will show two fractional digits.
 */
export function to$$$(num: number, minFractionDigits: number | undefined = 2, maxFractionDigits: number | undefined = 2): string {
    return num.toLocaleString('en', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: minFractionDigits,
        maximumFractionDigits: maxFractionDigits,
    });
}

/**
 * Get addresses of tokens that are considered equivalent to a given token.
 * For example, if the input token is ETH, this might return addresses for
 * WETH and stETH depending on the chain configuration.
 */
export async function getEquivalentTokenAddresses(chainName: string, token: BalancerToken): Promise<Address[]> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return [];

    const equivalentTokens = EQUIVALENT_TOKENS[chainId as keyof typeof EQUIVALENT_TOKENS];
    const equivalentSymbols = equivalentTokens?.[(token.symbol as string).toUpperCase() as keyof typeof equivalentTokens] || [];

    const addresses = await Promise.all(
        equivalentSymbols.map(async (symbol) => {
            const token = await getBalancerTokenBySymbol(chainName, symbol);
            return token?.address;
        }),
    );

    return addresses.filter((addr): addr is Address => !!addr);
}

/**
 * Given a list of token addresses, return for each token the address
 * of its wrapped version.  If the token is not a native token, the
 * function will return the input token address.
 */
export function getWrappedTokens(tokens: Address[], chainId: number): Address[] {
    return tokens.map((token) => getWrappedToken(token, chainId));
}

/**
 * Given a token address, return the address of its wrapped version.
 * If the token is not a native token, the function will return the
 * input token address.
 */
export function getWrappedToken(token: Address, chainId: number): Address {
    if (NATIVE_TOKEN_ADDRESS.toLowerCase() === token.toLowerCase()) {
        return NATIVE_ASSETS[chainId as keyof typeof NATIVE_ASSETS].wrapped;
    }
    return token;
}

/**
 * Given a token address, return the address of its unwrapped version,
 * that is, the address of the native token of the chain.  If the
 * token is not a wrapped token, the function will return the input
 * address.
 */
export function getUnwrappedToken(token: Address, chainId: number): Address {
    const chainNativeAsset = NATIVE_ASSETS[chainId as keyof typeof NATIVE_ASSETS];
    const isWrapped = chainNativeAsset.wrapped === token;
    if (isWrapped) {
        return NATIVE_TOKEN_ADDRESS;
    }
    return token;
}

/**
 * Given a token symbol and address, return the unwrapped symbol,
 * that is, the symbol of the native token of the chain.     If the
 * token is not a wrapped token, the function will return the input
 * symbol.
 */
export function getUnwrappedSymbol(symbol: string, token: Address, chainId: number): string {
    const chainNativeAsset = NATIVE_ASSETS[chainId as keyof typeof NATIVE_ASSETS];
    const isWrapped = chainNativeAsset.wrapped === token;
    if (isWrapped) {
        return chainNativeAsset.symbol as string;
    }
    return symbol;
}

/**
 * Extract token transfer amounts from a transaction receipt.
 * Returns the amounts of tokens transferred in and out for
 * the given account.
 *
 * For native tokens, the function will return 0.
 * To compute the amount of native tokens received, subtract
 * the initial balance from the final balance, and add spent
 * gas.  To compute the amount of native tokens sent, just
 * get the transaction and extract the value.
 */
export function getTokenTransferAmounts(
    receipt: TransactionReceipt,
    account: Address,
    tokenInAddress: Address,
    tokenOutAddress: Address,
): {
    tokenInAmountInWei: bigint;
    tokenOutAmountInWei: bigint;
} {
    let tokenInAmountInWei: bigint = 0n;
    let tokenOutAmountInWei: bigint = 0n;

    receipt.logs.forEach((log: Log) => {
        try {
            const event = decodeEventLog({ abi: erc20Abi, data: log.data, topics: log.topics });
            if (event.eventName === 'Transfer') {
                const { from, to, value } = event.args;
                if (from.toLowerCase() === account.toLowerCase() && log.address.toLowerCase() === tokenInAddress.toLowerCase()) {
                    tokenInAmountInWei = value;
                }
                if (to.toLowerCase() === account.toLowerCase() && log.address.toLowerCase() === tokenOutAddress.toLowerCase()) {
                    tokenOutAmountInWei = value;
                }
            }
        } catch (error) {
            // Skip logs that aren't Transfer events
        }
    });

    return { tokenInAmountInWei, tokenOutAmountInWei };
}
