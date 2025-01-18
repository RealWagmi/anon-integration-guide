declare module 'viem' {
    export type Address = `0x${string}`;
    
    export function encodeFunctionData(params: {
        abi: any;
        functionName: string;
        args: any[];
    }): string;
    
    export function parseUnits(value: string, decimals: number): bigint;
} 