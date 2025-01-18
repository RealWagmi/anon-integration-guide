declare module '@heyanon/sdk' {
    export type ChainId = 1 | 56 | 43114 | 42161 | 10 | 8453;
    
    export const ChainId: {
        ETHEREUM: 1,
        BSC: 56,
        AVALANCHE: 43114,
        ARBITRUM: 42161,
        OPTIMISM: 10,
        BASE: 8453
    };

    export interface FunctionReturn {
        success: boolean;
        error?: string;
        data?: any;
    }

    export interface FunctionOptions {
        sendTransactions: (params: { chainId: number; account: string; transactions: TransactionParams[] }) => Promise<any>;
        notify: (message: string) => Promise<void>;
        getProvider: (chainId: number) => any;
    }

    export interface TransactionParams {
        target: string;
        data: string;
        value?: bigint;
    }

    export function toResult(message: string, isError?: boolean): FunctionReturn;
    export function getChainName(chainId: number): string;
    export function getChainFromName(name: string): ChainId | undefined;
    export function checkToApprove(params: any): Promise<void>;

    export interface AiTool {
        name: string;
        description: string;
        required: string[];
        props: {
            name: string;
            type: string;
            description: string;
            enum?: string[];
            items?: { type: string };
        }[];
    }

    export interface AdapterExport {
        tools: AiTool[];
        functions: { [key: string]: Function };
        description: string;
    }

    export function getProvider(chainId: ChainId): any;
} 