import { erc20Abi, PublicClient, Address } from 'viem';

export interface TokenInfo {
    decimals: number;
    symbol: string;
}

export async function getTokenInfo(token: Address, provider: PublicClient): Promise<TokenInfo | null> {
    try {
        const decimals = await provider.readContract({
            address: token,
            abi: erc20Abi,
            functionName: 'decimals',
        });

        const symbol = await provider.readContract({
            address: token,
            abi: erc20Abi,
            functionName: 'symbol',
        });

        return { decimals, symbol };
    } catch (error) {
        return null;
    }
}
