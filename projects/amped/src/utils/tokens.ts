import { type Address } from 'viem';
import { CONTRACT_ADDRESSES, NETWORKS } from '../constants.js';

/**
 * Supported token symbols across all supported chains
 */
export type TokenSymbol = 
    | 'S'       // Sonic native token
    | 'WS'      // Wrapped Sonic
    | 'WETH'    // Wrapped Ethereum
    | 'ANON'    // Anon token
    | 'USDC'    // USD Coin
    | 'STS'     // Sonic Test Stablecoin
    | 'scUSD'   // Sonic USD
    | 'ETH'     // Ethereum (Base)
    | 'CBBTC'   // Coinbase BTC
    | 'VIRTUAL'; // Virtual USD

/**
 * Gets the contract address for a token symbol on a specific chain
 * @param symbol - Token symbol to look up
 * @param chainName - The chain name (e.g., "sonic", "base")
 * @returns The token's contract address
 */
export function getTokenAddress(symbol: TokenSymbol, chainName: string): Address {
    const networkName = chainName.toLowerCase();
    const contracts = CONTRACT_ADDRESSES[networkName];
    
    if (!contracts) {
        throw new Error(`Contract addresses not found for network: ${networkName}`);
    }
    
    switch (symbol) {
        case 'S':
            return contracts.NATIVE_TOKEN;
        case 'WS':
            return contracts.WRAPPED_NATIVE_TOKEN;
        case 'WETH':
            return contracts.WETH;
        case 'ANON':
            return contracts.ANON;
        case 'USDC':
            return contracts.USDC;
        case 'STS':
            return contracts.STS;
        case 'scUSD':
            return contracts.SCUSD;
        case 'ETH':
            return networkName === NETWORKS.BASE ? contracts.NATIVE_TOKEN : '0x0000000000000000000000000000000000000000' as Address;
        case 'CBBTC':
            return contracts.CBBTC || '0x0000000000000000000000000000000000000000' as Address;
        case 'VIRTUAL':
            return contracts.VIRTUAL || '0x0000000000000000000000000000000000000000' as Address;
        default:
            throw new Error(`Unsupported token symbol: ${symbol}`);
    }
}

/**
 * Gets the token decimals for a token symbol
 * @param symbol - Token symbol to look up
 * @returns The number of decimals for the token
 */
export function getTokenDecimals(symbol: TokenSymbol): number {
    switch (symbol) {
        case 'USDC':
        case 'scUSD':
            return 6;
        case 'S':
        case 'WS':
        case 'WETH':
        case 'ANON':
        case 'STS':
        case 'ETH':
        case 'CBBTC':
        case 'VIRTUAL':
            return 18;
        default:
            return 18;
    }
}

/**
 * Gets the token symbol for an address (reverse lookup)
 * @param address - Token address to look up
 * @param chainName - The chain name (e.g., "sonic", "base")
 * @returns The token symbol or undefined if not found
 */
export function getTokenSymbol(address: Address, chainName: string): TokenSymbol | undefined {
    const networkName = chainName.toLowerCase();
    const contracts = CONTRACT_ADDRESSES[networkName];
    
    if (!contracts) {
        return undefined;
    }
    
    // Normalize addresses for comparison
    const normalizedAddress = address.toLowerCase();
    
    if (normalizedAddress === contracts.NATIVE_TOKEN.toLowerCase()) {
        return networkName === NETWORKS.SONIC ? 'S' : 'ETH';
    }
    if (normalizedAddress === contracts.WRAPPED_NATIVE_TOKEN.toLowerCase()) {
        return networkName === NETWORKS.SONIC ? 'WS' : 'WETH';
    }
    if (normalizedAddress === contracts.WETH.toLowerCase()) {
        return 'WETH';
    }
    if (normalizedAddress === contracts.ANON?.toLowerCase()) {
        return 'ANON';
    }
    if (normalizedAddress === contracts.USDC.toLowerCase()) {
        return 'USDC';
    }
    if (normalizedAddress === contracts.STS?.toLowerCase()) {
        return 'STS';
    }
    if (normalizedAddress === contracts.SCUSD?.toLowerCase()) {
        return 'scUSD';
    }
    if (normalizedAddress === contracts.CBBTC?.toLowerCase()) {
        return 'CBBTC';
    }
    if (normalizedAddress === contracts.VIRTUAL?.toLowerCase()) {
        return 'VIRTUAL';
    }
    
    return undefined;
} 