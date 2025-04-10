import { Chain, EVM } from '@heyanon/sdk';

const { ChainIds } = EVM.constants;

export const supportedChains = [ChainIds[Chain.ARBITRUM]];
export const ARBITRUM_CHAIN_ID = ChainIds[Chain.ARBITRUM];
export const ARBITRUM_CHAIN_ID_HEX = `0x${ARBITRUM_CHAIN_ID.toString(16)}`;
export const HYPERLIQUID_L1_DOMAIN_CHAIN_ID = 1337;
export const USDC_DECIMALS = 6;
export const USDC_ADDRESS = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831';
export const HYPERLIQUID_BRIDGE_ADDRESS = '0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7';
export const MIN_BRIDGE_AMOUNT = 5;
export const MIN_WITHDRAW_AMOUNT = 2;
export const MAX_DECIMALS = 6;
export const MAX_SIGNIFICANT_DIGITS = 5;
export const MIN_HYPERLIQUID_TRADE_SIZE = 11;

// Time constants
export const ONE_HOUR_MS = 60 * 60 * 1000; // 1 hour
export const ONE_DAY_MS = 24 * ONE_HOUR_MS; // 1 day
export const ONE_WEEK_MS = 7 * ONE_DAY_MS; // 1 week
export const ONE_MONTH_MS = 30 * ONE_DAY_MS; // 1 month (approximated as 30 days)
export const DEFAULT_FUNDING_RATE_RANGE_MS = ONE_DAY_MS; // Default 24h

// Default slippage for immediate orders on Hyperliquid frontend
export const DEFAULT_HYPERLIQUID_SLIPPAGE = 0.08;

interface TokenInfo {
    tokenAddress: string;
    decimals: number;
    maxLeverage: number;
    nSigFigs: number;
    orderBookName: string;
    assetIndex: number;
    szDecimals: number;
}

export const hyperliquidPerps: { [perpTicker: string]: TokenInfo } = {
    BTC: {
        tokenAddress: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
        decimals: 8,
        maxLeverage: 5,
        nSigFigs: 5,
        orderBookName: 'BTC',
        assetIndex: 0,
        szDecimals: 5,
    },
    ETH: {
        tokenAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        decimals: 18,
        maxLeverage: 5,
        nSigFigs: 5,
        orderBookName: 'ETH',
        assetIndex: 1,
        szDecimals: 4,
    },
    LINK: {
        tokenAddress: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
        decimals: 18,
        maxLeverage: 5,
        nSigFigs: 5,
        orderBookName: 'LINK',
        assetIndex: 18,
        szDecimals: 1,
    },
    ARB: {
        tokenAddress: '0x912CE59144191C1204E64559FE8253a0e49E6548',
        decimals: 18,
        maxLeverage: 5,
        nSigFigs: 4,
        orderBookName: 'ARB',
        assetIndex: 11,
        szDecimals: 1,
    },
    HYPE: {
        tokenAddress: '',
        decimals: 0,
        maxLeverage: 3,
        nSigFigs: 4,
        orderBookName: 'HYPE',
        assetIndex: 159,
        szDecimals: 2,
    },
    PURR: {
        tokenAddress: '',
        decimals: 0,
        maxLeverage: 3,
        nSigFigs: 3,
        orderBookName: 'PURR',
        assetIndex: 152,
        szDecimals: 0,
    },
};
