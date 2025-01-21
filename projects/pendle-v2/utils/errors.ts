export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class ChainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ChainError';
    }
}

export class MarketError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'MarketError';
    }
} 