// mock.ts
import { OysterClient } from "./types";

export class MockOysterClient implements OysterClient {
    constructor(config: { chainId: number; provider: any; signer: any }) {}

    async createMarketOrder() {
        return { tx: { data: "0x", value: "0" } };
    }

    async createLimitOrder() {
        return { tx: { data: "0x", value: "0" } };
    }

    async createPosition() {
        return { tx: { data: "0x", value: "0" } };
    }

    async addLiquidity() {
        return { tx: { data: "0x", value: "0" } };
    }

    async removeLiquidity() {
        return { tx: { data: "0x", value: "0" } };
    }

    async adjustLiquidityRange() {
        return { tx: { data: "0x", value: "0" } };
    }

    async claimFees() {
        return { tx: { data: "0x", value: "0" } };
    }
}

// Use mock in development, real client in production
export const createClient = (config: { chainId: number; provider: any; signer: any }): OysterClient => {
    if (process.env.NODE_ENV === "production") {
        // TODO: Import and return real client when available
        throw new Error("Production client not yet implemented");
    }
    return new MockOysterClient(config);
}; 