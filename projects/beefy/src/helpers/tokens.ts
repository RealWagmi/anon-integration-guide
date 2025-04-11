import { Address } from 'viem';
import { WAD } from '../constants';
import BeefyClient, { TokenInfo } from './beefyClient';
import { getBeefyChainNameFromAnonChainName } from './chains';

/**
 * Multiply a token amount in wei by a floating point number
 */
export function multiplyTokenAmount(amountInWei: bigint, multiplier: number): bigint {
    return (amountInWei * BigInt(Number(WAD) * multiplier)) / WAD;
}

/**
 * Get the fraction of a token that the user holds with respect to the total supply.
 */
export function getTokenFraction(amountInWei: bigint, totalSupplyInWei: bigint): number {
    return Number((WAD * amountInWei) / totalSupplyInWei) / Number(WAD);
}

/**
 * Fetch information about the given token symbol from the Beefy API
 */
export async function getTokenInfoFromSymbol(heyAnonChainName: string, symbol: string): Promise<TokenInfo> {
    const beefyClient = new BeefyClient();
    const tokenInfo = await beefyClient.getTokens();
    const beefyChainName = getBeefyChainNameFromAnonChainName(heyAnonChainName);
    let token = Object.values(tokenInfo[beefyChainName]).find((token) => token.symbol.toLowerCase() === symbol.toLowerCase());
    if (!token) {
        // Try again with the id... for some reason, it seems that Beefy
        // does not always store the token symbol in the token.symbol
        // property
        token = Object.values(tokenInfo[beefyChainName]).find((token) => token.id.toLowerCase() === symbol.toLowerCase());
    }
    if (!token) {
        throw new Error(`Could not find info on token ${symbol} on chain ${beefyChainName}`);
    }
    return token;
}

/**
 * Fetch information about the given token address from the Beefy API
 */
export async function getTokenInfoFromAddress(heyAnonChainName: string, address: Address): Promise<TokenInfo> {
    const beefyClient = new BeefyClient();
    const tokenInfo = await beefyClient.getTokens();
    const beefyChainName = getBeefyChainNameFromAnonChainName(heyAnonChainName);
    const token = Object.values(tokenInfo[beefyChainName]).find((token) => token.address.toLowerCase() === address.toLowerCase());
    if (!token) {
        throw new Error(`Could not find info on token ${address} on chain ${beefyChainName}`);
    }
    return token;
}
