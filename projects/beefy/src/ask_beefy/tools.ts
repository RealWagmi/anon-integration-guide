import { AiTool, EVM } from '@heyanon/sdk';
import { supportedChains } from '../constants';

/**
 * Tools specific for the askBeets agent, and that are not
 * included in the HeyAnon integration because they could
 * interfer with HeyAnon's functionality.
 */
export const tools: AiTool[] = [
    {
        name: 'getTokenAddressFromSymbol',
        description: 'Get the address of a token from its symbol.',
        required: ['chainName', 'symbol'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(EVM.utils.getChainName),
                description: 'Chain name',
            },
            {
                name: 'symbol',
                type: 'string',
                description: 'Token symbol (e.g. "wS", "stS", "USDC.e")',
            },
        ],
    },
    {
        name: 'getTokenBalance',
        description: "Get the balance of a token in the user's wallet.",
        required: ['chainName', 'account', 'tokenAddress'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(EVM.utils.getChainName),
                description: 'Chain name',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address',
            },
            {
                name: 'tokenAddress',
                type: 'string',
                description: 'Token address',
            },
        ],
    },
];
