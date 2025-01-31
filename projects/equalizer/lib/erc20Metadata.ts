import { Address, erc20Abi, PublicClient } from 'viem';
import { getChainFromName } from '@heyanon/sdk';
import { supportedChains } from '../constants';

interface Props {
    chainName: string;
    tokenAddress: Address;
    publicClient: PublicClient;
}

interface TokenMetadata {
    address: Address;
    name: string;
    symbol: string;
    decimals: number;
}

/**
 * Retrieves metadata for an ERC20 token including name, symbol, and decimals.
 * @param props - The query parameters including chain and token address.
 * @returns Token metadata information.
 */
export async function getTokenMetadata({ chainName, tokenAddress, publicClient }: Props): Promise<TokenMetadata> {
    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) throw new Error(`Unsupported chain name: ${chainName}`);
    if (!supportedChains.includes(chainId)) throw new Error(`Network ${chainName} is not supported`);

    // Validate token address
    if (!tokenAddress) throw new Error('Token address is required');

    try {
        // Fetch token metadata in parallel
        const [name, symbol, decimals] = await Promise.all([
            publicClient.readContract({
                address: tokenAddress,
                abi: erc20Abi,
                functionName: 'name',
            }),
            publicClient.readContract({
                address: tokenAddress,
                abi: erc20Abi,
                functionName: 'symbol',
            }),
            publicClient.readContract({
                address: tokenAddress,
                abi: erc20Abi,
                functionName: 'decimals',
            }),
        ]);

        const metadata: TokenMetadata = {
            address: tokenAddress,
            name,
            symbol,
            decimals,
        };

        // Return formatted metadata
        return metadata;
    } catch (error) {
        console.error('Error fetching token metadata:', error);
        throw new Error(`Failed to fetch metadata for token ${tokenAddress}. The contract may not be an ERC20 token.`);
    }
}
