export interface Result<T> {
    success: boolean;
    data?: T;
    error?: Error | string;
}

export interface ValidationError extends Error {
    name: 'ValidationError';
    message: string;
}

export interface ChainError extends Error {
    name: 'ChainError';
    message: string;
}

export interface MarketError extends Error {
    name: 'MarketError';
    message: string;
}

export interface Utils {
    getProvider: () => any;
    sendTransactions?: (params: any) => Promise<any>;
    notify?: (message: string) => Promise<void>;
} 