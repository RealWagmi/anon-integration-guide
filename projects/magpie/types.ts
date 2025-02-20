import { Address, Hex } from 'viem';

export enum NetworkName {
    Bsc = 'bsc',
    Ethereum = 'ethereum',
    Avalanche = 'avalanche',
    Arbitrum = 'arbitrum',
    Base = 'base',
    Sonic = 'sonic',
}

export type TokensResponse = {
    id: string;
    name: string;
    symbol: string;
    address: string;
    decimals: number;
    displayDecimals: number;
    isReliable: boolean;
    logoUrl: string;
    usdPrice: string;
    network: {
        id: number;
    };
}[];

export interface Token {
    id: string;
    name: string;
    symbol: string;
    address: string;
    decimals: number;
    displayDecimals: number;
    isReliable: boolean;
    logoUrl: string;
    usdPrice: string;
    chainName: string;
}

export type BalancesResponse = {
    walletAddress: string;
    tokenAddress: string;
    amount: string;
    networkId: number;
}[];

export interface Balance {
    walletAddress: string;
    tokenAddress: string;
    amount: string;
    chainName: string;
}

export interface QuoteResponse {
    id: string;
    amountOut: string;
    targetAddress: Address;
}

export interface TransactionResponse {
    data: Hex;
    value: string;
}
