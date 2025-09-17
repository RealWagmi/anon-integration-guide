import { Chain, EvmChain, EVM } from '@heyanon/sdk';

export interface TokenInfo {
    type: 'erc20' | 'native';
    symbol: string;
    name: string;
    chainId: number;
    address: `0x${string}`;
    decimals: number;
}

/**
 * Tokens supported by the agent
 */
export const tokens: Partial<Record<EvmChain, TokenInfo[]>> = {
    [Chain.ETHEREUM]: [
        {
            type: 'erc20',
            symbol: 'USDC',
            name: 'USDC',
            chainId: EVM.constants.ChainIds[Chain.ETHEREUM],
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            decimals: 6,
        },
    ],
};

/**
 * Return token details from its symbol
 */
export function getTokenInfoFromSymbol(chainName: EvmChain, symbol: string): TokenInfo | null {
    const chainTokens = tokens[chainName];
    if (!chainTokens) return null;
    return chainTokens.find((token) => token.symbol === symbol) || null;
}

/**
 * Return token details from its address
 */
export function getTokenInfoFromAddress(chainName: EvmChain, address: `0x${string}`): TokenInfo | null {
    const chainTokens = tokens[chainName];
    if (!chainTokens) return null;
    return chainTokens.find((token) => token.address === address) || null;
}
