import { FunctionReturn, FunctionOptions, toResult } from '@heyanon/sdk';
import axios from 'axios';
import { DEBRIDGE_API_URL } from '../constants';

interface Props {
    chainId: string;
    tokenAddress?: string;
    search?: string;
}

interface TokenInfo {
    name: string;
    symbol: string;
    address: string;
    decimals: number;
}

interface TokenListResponse {
    tokens: Record<string, TokenInfo>;
}

/**
 * Get token information from a chain.
 * For EVM chains: use 0x-prefixed address
 * For Solana: use base58 token address
 * 
 * @param props - The function parameters
 * @param props.chainId - Chain ID to get token information for
 * @param props.tokenAddress - Optional specific token address to query information for
 * @param props.search - Optional search term to filter tokens by name or symbol
 * @param tools - System tools for blockchain interactions
 * @returns Token information including name, symbol, address, and decimals
 */
export async function getTokenInfo(
    { chainId, tokenAddress, search }: Props,
    { notify }: FunctionOptions
): Promise<FunctionReturn> {
    try {
        await notify('Fetching token information...');

        const url = `${DEBRIDGE_API_URL}/token-list?chainId=${chainId}`;
        
        try {
            const response = await axios.get<TokenListResponse>(url);
            const data = response.data;

            const tokens = data.tokens;

            // If a specific token address is provided
            if (tokenAddress) {
                const tokenInfo = tokens[tokenAddress];
                if (!tokenInfo) {
                    return toResult(`Token ${tokenAddress} not found on chain ${chainId}`, true);
                }
                return toResult(`Token Information:
Name: ${tokenInfo.name}
Symbol: ${tokenInfo.symbol}
Address: ${tokenAddress}
Decimals: ${tokenInfo.decimals}`);
            }

            // If search term is provided, filter tokens
            let filteredTokens = Object.entries(tokens);
            if (search) {
                const searchLower = search.toLowerCase();
                filteredTokens = filteredTokens.filter(([_, token]) =>
                    token.name.toLowerCase().includes(searchLower) ||
                    token.symbol.toLowerCase().includes(searchLower)
                );
            }

            // Limit results to avoid overwhelming response
            const limitedTokens = filteredTokens.slice(0, 10);
            
            if (limitedTokens.length === 0) {
                return toResult(search 
                    ? `No tokens found matching "${search}" on chain ${chainId}`
                    : `No tokens found on chain ${chainId}`, 
                    true
                );
            }

            const tokenList = limitedTokens
                .map(([address, token]) => 
                    `${token.name} (${token.symbol})
Address: ${address}
Decimals: ${token.decimals}
---`
                )
                .join('\n');

            return toResult(`Found ${filteredTokens.length} tokens${search ? ` matching "${search}"` : ''}.
Showing first ${limitedTokens.length}:\n\n${tokenList}`);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const text = error.response?.data;
                return toResult(`Failed to fetch token information: ${text}`, true);
            }
            throw error;
        }
    } catch (error) {
        return toResult(`Failed to get token information: ${error}`, true);
    }
}
