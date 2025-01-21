import { WETH9 } from '@heyanon/sdk';
import { ChainId, Token } from '@traderjoe-xyz/sdk-core';
import { Address, erc20Abi, PublicClient } from 'viem';

export async function getTokenInfo(chainId: ChainId, provider: PublicClient, tokenAddress: Address): Promise<Token | null> {
    const decimals = await provider.readContract({
        abi: erc20Abi,
        address: tokenAddress,
        functionName: 'decimals',
    });

    const name = await provider.readContract({
        abi: erc20Abi,
        address: tokenAddress,
        functionName: 'name',
    });

    const symbol = await provider.readContract({
        abi: erc20Abi,
        address: tokenAddress,
        functionName: 'symbol',
    });

    return new Token(chainId, tokenAddress, decimals, name, symbol);
}
