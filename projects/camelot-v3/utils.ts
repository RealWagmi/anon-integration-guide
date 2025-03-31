import { Address, erc20Abi, formatUnits, parseUnits, PublicClient } from 'viem';
import { MAX_TICK, MIN_TICK } from './constants';

export async function getSymbol(provider: PublicClient, token: Address): Promise<String> {
    // Try-catch to detect invalid token address
    try {
        return provider.readContract({
            address: token,
            abi: erc20Abi,
            functionName: 'symbol',
            args: [],
        });
    } catch (error) {
        throw new Error(`Invalid ERC20 token contract at address ${token}. Failed to fetch token details`);
    }
}

export async function getDecimals(provider: PublicClient, token: Address): Promise<number> {
    // Try-catch to detect invalid token address
    try {
        return provider.readContract({
            address: token,
            abi: erc20Abi,
            functionName: 'decimals',
            args: [],
        });
    } catch (error) {
        throw new Error(`Invalid ERC20 token contract at address ${token}. Failed to fetch token details`);
    }
}

export async function amountToWei(provider: PublicClient, token: Address, amount: string | undefined): Promise<bigint> {
    if (!amount) return 0n;


    const decimals = await getDecimals(provider, token);
    return parseUnits(amount, decimals);
}

export async function weiToAmount(provider: PublicClient, token: Address, amountInWei: bigint): Promise<string> {
    const decimals = await getDecimals(provider, token);
    return formatUnits(amountInWei, decimals);
}