export interface Result<T> {
    success: boolean;
    data?: T;
    error?: Error;
}

export interface ValidationError extends Error {
    name: 'ValidationError';
    message: string;
} 