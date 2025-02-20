// constants.ts
export const supportedChains = [8453]; // BASE

// Core contract addresses on Base network
export const ADDRESSES = {
    OysterAMM: "0x1234567890123456789012345678901234567890" as `0x${string}`, // TODO: Replace with actual address
    OrderBook: "0x1234567890123456789012345678901234567890" as `0x${string}`, // TODO: Replace with actual address
    PriceOracle: "0x1234567890123456789012345678901234567890" as `0x${string}`, // TODO: Replace with actual address
    LiquidityPool: "0x1234567890123456789012345678901234567890" as `0x${string}`, // TODO: Replace with actual address
    PositionManager: "0x1234567890123456789012345678901234567890" as `0x${string}` // TODO: Replace with actual address
} as const;

// Chain configuration
export const ChainId = {
    BASE: 8453
} as const;

// Helper functions
export function getChainFromName(chainName: string): number | null {
    if (chainName === 'BASE') return ChainId.BASE;
    return null;
}

export function toResult(message: string, isError: boolean = false): { success: boolean; data: string } {
    return {
        success: !isError,
        data: message
    };
} 