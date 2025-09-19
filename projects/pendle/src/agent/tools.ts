import { AdapterExport, EVM } from '@heyanon/sdk';
import { supportedChains } from '../constants';

const { getChainName } = EVM.utils;

/**
 * Tools specific for the agent, and that are not
 * included in the HeyAnon integration because they could
 * interfer with HeyAnon's functionality.
 */
export const tools = [
    {
        type: 'function',
        function: {
            name: 'getTokenAddressFromSymbol',
            description: 'Get the address of a token from its symbol.',
            parameters: {
                type: 'object',
                properties: {
                    chainName: {
                        type: 'string',
                        enum: supportedChains.map(getChainName),
                        description: 'Chain name',
                    },
                    symbol: {
                        type: 'string',
                        description: 'Token symbol (e.g. "wS", "stS", "USDC.e")',
                    },
                },
                required: ['chainName', 'symbol'],
                additionalProperties: false,
            },
            strict: true,
        },
    },
    {
        type: 'function',
        function: {
            name: 'getTokenBalance',
            description: "Get the balance of a token in the user's wallet.",
            parameters: {
                type: 'object',
                properties: {
                    chainName: {
                        type: 'string',
                        enum: supportedChains.map(EVM.utils.getChainName),
                        description: 'Chain name',
                    },
                    account: {
                        type: 'string',
                        description: 'Account address',
                    },
                    tokenAddress: {
                        type: 'string',
                        description: 'Token address',
                    },
                },
                required: ['chainName', 'account', 'tokenAddress'],
                additionalProperties: false,
            },
        },
    },
] satisfies AdapterExport['tools'];
