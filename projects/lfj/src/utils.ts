import { ChainId, Token } from '@traderjoe-xyz/sdk-core';
import { Address, erc20Abi, PublicClient, getContract } from 'viem';

export async function getTokenInfo(chainId: ChainId, provider: PublicClient, tokenAddress: Address): Promise<Token | null> {
    const contract = getContract({
        address: tokenAddress,
        abi: erc20Abi,
        client: provider,
    });

    try {
        const decimals = await contract.read.decimals();
        const name = await contract.read.name();
        const symbol = await contract.read.symbol();
        return new Token(chainId, tokenAddress, decimals, name, symbol);
    } catch (error) {
        return null;
    }
}
