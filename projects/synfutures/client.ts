// client.ts
import { type PublicClient, type Address } from "viem";
import { OysterClient } from "./types";

export interface ClientConfig {
    chainId: number;
    provider: PublicClient;
    signer: Address;
}

export interface OrderResult {
    tx: {
        data: `0x${string}`;
        value?: string;
    };
}

// Mock implementation for testing
export class SynFuturesClient {
    private chainId: number;
    private provider: PublicClient;
    private signer: Address;

    constructor(config: ClientConfig) {
        this.chainId = config.chainId;
        this.provider = config.provider;
        this.signer = config.signer;
    }

    async createMarketOrder(order: {
        pair: string;
        side: "BUY" | "SELL";
        amount: string;
        slippage: number;
    }): Promise<OrderResult> {
        // Mock transaction data for testing
        return {
            tx: {
                data: `0x1234567890${this.signer.slice(2)}${"0".repeat(24)}`,
                value: "0"
            }
        };
    }

    async createLimitOrder(order: {
        pair: string;
        side: "BUY" | "SELL";
        amount: string;
        price: string;
    }): Promise<OrderResult> {
        // Mock transaction data for testing
        return {
            tx: {
                data: `0x1234567890${this.signer.slice(2)}${"0".repeat(24)}`,
                value: "0"
            }
        };
    }

    async addLiquidity(params: {
        pair: string;
        amount: string;
        lowerTick: number;
        upperTick: number;
    }): Promise<OrderResult> {
        // Mock transaction data for testing
        return {
            tx: {
                data: `0x1234567890${this.signer.slice(2)}${"0".repeat(24)}`,
                value: "0"
            }
        };
    }

    async removeLiquidity(params: {
        positionId: string;
        percentage: number;
    }): Promise<OrderResult> {
        // Mock transaction data for testing
        const mockTxData = `0x1234567890${this.signer.slice(2)}${"0".repeat(24)}` as `0x${string}`;
        return {
            tx: {
                data: mockTxData,
                value: "0"
            }
        };
    }

    async adjustLiquidityRange(params: {
        positionId: string;
        newLowerTick: number;
        newUpperTick: number;
    }): Promise<OrderResult> {
        // Mock transaction data for testing
        return {
            tx: {
                data: `0x1234567890${this.signer.slice(2)}${"0".repeat(24)}`,
                value: "0"
            }
        };
    }

    async claimFees(params: {
        positionId: string;
    }): Promise<OrderResult> {
        // Mock transaction data for testing
        return {
            tx: {
                data: `0x1234567890${this.signer.slice(2)}${"0".repeat(24)}`,
                value: "0"
            }
        };
    }
} 