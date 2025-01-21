import { type Address } from 'viem';

export interface Utils {
    sendTransactions: (params: any) => Promise<any>;
    notify: (message: string) => Promise<void>;
    getProvider: () => any;
}

export interface TransactionParams {
    transactions: {
        target: Address;
        data: string;
    }[];
} 