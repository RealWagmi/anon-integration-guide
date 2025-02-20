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
        to: `0x${string}`;
        data: `0x${string}`;
        value?: string;
    };
}

// Mock implementation for testing
export class SynFuturesClient {
    private chainId: number;
    private provider: PublicClient;
    private signer: Address;
    private mockContractAddress: `0x${string}` = "0x1234567890123456789012345678901234567890";

    constructor(config: ClientConfig) {
        this.chainId = config.chainId;
        this.provider = config.provider;
        this.signer = config.signer;
    }

    async createPosition(order: {
        pair: string;
        side: "LONG" | "SHORT";
        leverage: string;
        margin: string;
        stopLoss?: string;
        takeProfit?: string;
        trailingStop?: string;
    }): Promise<OrderResult> {
        // Mock transaction data for testing
        return {
            tx: {
                to: this.mockContractAddress,
                data: `0x1234567890${this.signer.slice(2)}${"0".repeat(24)}`,
                value: "0"
            }
        };
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
                to: this.mockContractAddress,
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
                to: this.mockContractAddress,
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
        useAutoRange?: boolean;
        dynamicFeeThreshold?: string;
    }): Promise<OrderResult> {
        // Mock transaction data for testing
        return {
            tx: {
                to: this.mockContractAddress,
                data: `0x1234567890${this.signer.slice(2)}${"0".repeat(24)}`,
                value: "0"
            }
        };
    }

    async removeLiquidity(params: {
        positionId: string;
        percentage: number;
        collectFees?: boolean;
        minAmountOut?: string;
    }): Promise<OrderResult> {
        // Mock transaction data for testing
        return {
            tx: {
                to: this.mockContractAddress,
                data: `0x1234567890${this.signer.slice(2)}${"0".repeat(24)}`,
                value: "0"
            }
        };
    }

    async adjustLiquidityRange(params: {
        positionId: string;
        newLowerTick: number;
        newUpperTick: number;
        adjustmentStrategy?: "SHIFT" | "WIDEN" | "NARROW";
        rebalanceTokens?: boolean;
    }): Promise<OrderResult> {
        // Mock transaction data for testing
        return {
            tx: {
                to: this.mockContractAddress,
                data: `0x1234567890${this.signer.slice(2)}${"0".repeat(24)}`,
                value: "0"
            }
        };
    }

    async claimFees(params: {
        positionId: string;
        reinvest?: boolean;
        claimAll?: boolean;
    }): Promise<OrderResult> {
        // Mock transaction data for testing
        return {
            tx: {
                to: this.mockContractAddress,
                data: `0x1234567890${this.signer.slice(2)}${"0".repeat(24)}`,
                value: "0"
            }
        };
    }
} 