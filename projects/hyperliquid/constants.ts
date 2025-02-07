import { ChainId } from '@heyanon/sdk';

export const supportedChains = [ChainId.ARBITRUM];
export const ARBITRUM_CHAIN_ID = ChainId.ARBITRUM;
export const ARBITRUM_CHAIN_ID_HEX = `0x${ChainId.ARBITRUM.toString(16)}`;
export const HYPERLIQUID_L1_DOMAIN_CHAIN_ID = 1337;
export const USDC_DECIMALS = 6;
export const USDC_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
export const HYPERLIQUID_BRIDGE_ADDRESS = '0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7';
export const MIN_BRIDGE_AMOUNT = 5;
export const MIN_WITHDRAW_AMOUNT = 2;
export const MAX_DECIMALS = 6;
export const MAX_SIGNIFICANT_DIGITS = 5;
export const MIN_HYPERLIQUID_TRADE_SIZE = 11;

interface TokenInfo {
    tokenAddress: string;
    decimals: number;
    maxLeverage: number;
    nSigFigs: number;
    orderBookName: string;
    assetIndex: number;
}

export const hyperliquidPerps: { [perpTicker: string]: TokenInfo } = {
    BTC: {
        tokenAddress: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
        decimals: 8,
        maxLeverage: 5,
        nSigFigs: 5,
        orderBookName: 'BTC',
        assetIndex: 0,
    },
    ETH: {
        tokenAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        decimals: 18,
        maxLeverage: 5,
        nSigFigs: 5,
        orderBookName: 'ETH',
        assetIndex: 1,
    },
    LINK: {
        tokenAddress: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
        decimals: 18,
        maxLeverage: 5,
        nSigFigs: 5,
        orderBookName: 'LINK',
        assetIndex: 18,
    },
    ARB: {
        tokenAddress: '0x912CE59144191C1204E64559FE8253a0e49E6548',
        decimals: 18,
        maxLeverage: 5,
        nSigFigs: 4,
        orderBookName: 'ARB',
        assetIndex: 11,
    },
    HYPE: {
        tokenAddress: '',
        decimals: 0,
        maxLeverage: 3,
        nSigFigs: 4,
        orderBookName: 'HYPE',
        assetIndex: 159,
    },
    PURR: {
        tokenAddress: '',
        decimals: 0,
        maxLeverage: 3,
        nSigFigs: 3,
        orderBookName: 'PURR',
        assetIndex: 152,
    },
};
