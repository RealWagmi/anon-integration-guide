import { ChainId } from '@heyanon/sdk/src/blockchain/constants/chains';

// Supported chains based on LayerZeroHelper.sol
export const supportedChains = [
    ChainId.ETHEREUM,  // 1
    ChainId.BSC,      // 56
    ChainId.AVALANCHE, // 43114
    ChainId.ARBITRUM,  // 42161
    ChainId.OPTIMISM,  // 10
    ChainId.BASE,      // 8453
    ChainId.SEPOLIA,   // 11155111 (Ethereum testnet)
    ChainId.ONE_SEPOLIA // 421614 (Arbitrum Sepolia testnet)
];

// Contract addresses per chain
export const ADDRESSES: { [chainId: number]: { [key: string]: string } } = {
    [ChainId.ETHEREUM]: {
        MARKET_FACTORY: "0x27b1dAcd74688aF24a64BD3C9C1B143118740784",
        GAUGE_CONTROLLER: "0x86652c1301843B4E06fBfbBDaA6849266fb2b5e7",
        FEE_DISTRIBUTOR: "0x2C9c1E9b4BDf6Bf9CB59C77e0e8C0892dB31549F",
        VOTING_ESCROW: "0x4f30A9D41B80ecC5B94306AB4364951AE3170210"
    },
    [ChainId.ARBITRUM]: {
        MARKET_FACTORY: "0x2FCb47B58350cD377f94d3821e7373Df60bD9Ced",
        GAUGE_CONTROLLER: "0x4D5F06cB425e5a8E91C7387c0A5F814FA85F3c32",
        FEE_DISTRIBUTOR: "0x2C9c1E9b4BDf6Bf9CB59C77e0e8C0892dB31549F",
        VOTING_ESCROW: "0x4f30A9D41B80ecC5B94306AB4364951AE3170210"
    },
    [ChainId.SEPOLIA]: {
        // Add Sepolia testnet addresses when available
        MARKET_FACTORY: "0x0",
        GAUGE_CONTROLLER: "0x0",
        FEE_DISTRIBUTOR: "0x0",
        VOTING_ESCROW: "0x0"
    }
};

// Common constants
export const WEEK = 7 * 24 * 60 * 60; // 1 week in seconds
export const MAX_LOCK_TIME = 2 * 365 * 24 * 60 * 60; // 2 years in seconds
