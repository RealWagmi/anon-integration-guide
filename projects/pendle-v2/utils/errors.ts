export class PendleError extends Error {
    constructor(message: string, public readonly code: string) {
        super(message);
        this.name = 'PendleError';
    }
}

export const ERRORS = {
    INVALID_CHAIN: 'INVALID_CHAIN',
    MARKET_EXPIRED: 'MARKET_EXPIRED',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    SLIPPAGE_TOO_HIGH: 'SLIPPAGE_TOO_HIGH',
    INVALID_MARKET: 'INVALID_MARKET',
    CONTRACT_ERROR: 'CONTRACT_ERROR',
    // ... other error codes
} as const;

export function handleError(error: unknown): string {
    if (error instanceof PendleError) {
        return `${error.code}: ${error.message}`;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'Unknown error occurred';
} 