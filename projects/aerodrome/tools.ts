import { AiTool } from '@heyanon/sdk';

export const tools: AiTool[] = [
    {
        name: 'quoteExactInput',
        description: 'Returns calculated amount for swaps. Is specialized for routes containing a mix of V2 and V3 liquidity',
        required: [],
        props: [],
    },
    {
        name: 'execute',
        description: 'Executes a swap along with provided inputs',
        required: [],
        props: [],
    },
];
