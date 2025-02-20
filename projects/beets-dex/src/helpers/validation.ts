import { Address } from '@balancer/sdk';
import { getBalancerTokenByAddress, getWrappedTokens } from './tokens';
import { GqlPoolMinimal, GqlPoolTokenDetail, GqlToken } from './beets/types';
import { PublicClient, erc20Abi, parseUnits } from 'viem';
import { NATIVE_TOKEN_ADDRESS } from '../constants';
import { toHumanReadableAmount } from './tokens';
import { EVM, EvmChain } from '@heyanon/sdk';

/**
 * Validate an amount of tokens, in decimal form, expressed as a string.
 *
 * By Decimal Form, we mean that the amount is expressed as a number
 * of actual human-readable tokens, not in wei or other units.
 */
export function validateTokenPositiveDecimalAmount(amount: string): boolean {
    const number = Number(amount);
    return !isNaN(number) && number > 0 && number < 1e18;
}

/**
 * Validate a percentage (e.g. 20 to indicate 20%), expressed as
 * a string.
 */
export function validatePercentage(percentage: string): boolean {
    const number = Number(percentage);
    return !isNaN(number) && number >= 0 && number <= 100;
}

/**
 * Validate a pool ID
 */
export function validatePoolId(poolId: string): boolean {
    return poolId.startsWith('0x');
}

/**
 * Verifies if all provided token addresses are present in the given Gql pool,
 * accounting also for underlying tokens.
 *
 * Automatically wraps native tokens before the check.
 *
 * Returns an array of [isValid: boolean, errorMessage: string | null]
 */
export async function validateTokensAreInPool(chainName: string, pool: GqlPoolMinimal, tokenAddresses: Address[]): Promise<[boolean, string | null]> {
    // Get addresses of pool tokens, including any underlying tokens
    const poolTokens: (GqlPoolTokenDetail | GqlToken)[] = [];
    for (const token of pool.poolTokens) {
        poolTokens.push(token);
        if (token.underlyingToken) {
            poolTokens.push(token.underlyingToken);
        }
    }

    const poolAddresses = poolTokens.map((t) => t.address);
    const chainId = EVM.utils.getChainFromName(chainName as EvmChain);
    if (!chainId) return [false, `Invalid chain name: ${chainName}`];

    const wrappedTokenAddresses = getWrappedTokens(tokenAddresses, chainId);

    for (const tokenAddress of wrappedTokenAddresses) {
        if (!poolAddresses.includes(tokenAddress)) {
            const tokenInfo = await getBalancerTokenByAddress(chainName, tokenAddress);
            if (!tokenInfo) return [false, `Could not find info for token ${tokenAddress}`];
            return [false, `Token ${tokenInfo.symbol} is not among the pool's tokens (${poolTokens.map((t) => t.symbol).join(', ')})`];
        }
    }

    return [true, null];
}

/**
 * Validate that an account has a given token, regardless of
 * the amount.
 *
 * The token must be in Balancer's token list, otherwise the function
 * will return false.
 */
export async function validateHasToken(publicClient: PublicClient, account: Address, tokenAddress: Address): Promise<boolean> {
    const [hasBalance, _errorMessage, _balances] = await validateTokenBalances(publicClient, account, [{ address: tokenAddress, amount: '0' }]);
    return hasBalance;
}

/**
 * Validates if an account has sufficient balance for the specified tokens and amounts.
 * Returns [hasBalance, errorMessage, balances] where balances contains the human readable amounts
 *
 * Both the token address and the amount must be in Balancer's token list, otherwise the function
 * will return false.
 */
export async function validateTokenBalances(
    publicClient: PublicClient,
    account: Address,
    tokens: Array<{
        address: Address;
        amount: string;
    }>,
): Promise<[boolean, string | null, { [address: string]: string }]> {
    const balances: { [address: string]: string } = {};

    for (const token of tokens) {
        // Get token info
        const tokenInfo = await getBalancerTokenByAddress(publicClient.chain?.name ?? '', token.address);
        if (!tokenInfo) {
            return [false, `Could not find info for token ${token.address}`, {}];
        }

        const amountWei = parseUnits(token.amount, tokenInfo.decimals);

        let balanceInWei: bigint;
        if (token.address === NATIVE_TOKEN_ADDRESS) {
            balanceInWei = await publicClient.getBalance({ address: account });
        } else {
            balanceInWei = await publicClient.readContract({
                address: token.address,
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [account],
            });
        }

        // Store human readable balance
        balances[token.address] = toHumanReadableAmount(balanceInWei, tokenInfo.decimals, tokenInfo.decimals, tokenInfo.decimals);

        if (balanceInWei < amountWei) {
            return [false, `Not enough ${tokenInfo.symbol}: you have ${balances[token.address]}, need ${token.amount}`, balances];
        }
    }

    return [true, null, balances];
}
