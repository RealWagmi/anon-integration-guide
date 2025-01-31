import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'addLiquidity',
        description: 'Adds liquidity to an Equalizer pair.',
        required: ['token0Address', 'token1Address', 'amount0Desired', 'amount1Desired'],
        props: [
            {
                name: 'token0Address',
                type: 'string',
                description: 'Address of the first token in the pair',
            },
            {
                name: 'token1Address',
                type: 'string',
                description: 'Address of the second token in the pair',
            },
            {
                name: 'amount0Desired',
                type: 'string',
                description: 'Desired amount of first token to add in decimal format',
            },
            {
                name: 'amount1Desired',
                type: 'string',
                description: 'Desired amount of second token to add in decimal format',
            },
        ],
    },
];
