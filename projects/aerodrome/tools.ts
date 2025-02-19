import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

const walletProps = [
    {
        name: 'chainName',
        type: 'string',
        enum: supportedChains.map(getChainName),
        description: 'The name of the chain on which the transaction will be executed.',
    },
    {
        name: 'account',
        type: 'string',
        description: 'Account address that will execute transaction',
    },
];

const walletRequiredProps = ['chainName', 'account'];

const swapObject = {
    description: 'Command: V3 swap exact in',
    type: 'object',
    properties: {
        commandCode: { const: '00' },
        recipient: { type: 'string' },
        amountIn: { type: 'string' },
        amountOutMin: { type: 'string' },
        path: { type: 'string' },
        payerIsUser: { type: 'boolean' }
    },
    required: ['commandCode', 'recipient', 'amountIn', 'amountOutMin', 'path', 'payerIsUser'],
}

const swapProps = {
    name: 'swap',
    ...swapObject,
}

const permitObject = {
    description: 'Low level object defining permit',
    type: 'object',
    properties: {
        token: 'string',
        amount: 'string',
        expiration: 'string',
        nonce: 'string',
    },
    required: ['token', 'amount', 'expiration', 'nonce']
};

const routeObject = {
    description: 'Low level object defining V2 route',
    type: 'object',
    properties: {
        from: 'string',
        to: 'string',
        stable: 'boolean',
    },
    required: ['from', 'to', 'stable']
};

const allowanceTransferObject = {
    description: 'Low level object defining allowance transfer',
    type: 'object',
    properties: {
        from: 'string',
        to: 'string',
        amount: 'string',
        token: 'string',
    },
    required: ['from', 'to', 'amount', 'token'],
}

export const tools: AiTool[] = [
    {
        name: 'quoteExactInput',
        description: 'Returns calculated amount for swaps. Is specialized for routes containing a mix of V2 and V3 liquidity',
        required: [...walletRequiredProps, 'tokens', 'fees', 'amountIn'],
        props: [
            ...walletProps,
            {
                name: 'tokens',
                type: 'array',
                items: { type: 'string' },
                description: 'List of tokens between which you want to swap. There should be at least 2. Between each consecutive tokens there should be a pool.',
            },
            {
                name: 'fees',
                type: 'array',
                items: { type: 'string' },
                description:
                    'List of fees between each consecutive tokens. The fees are ordered and apply to each consecutive token pair fe. `fee[0]` would apply to pair of `tokens[0]` and `tokens[1]`',
            },
            {
                name: 'amountIn',
                type: 'string',
                description: 'Amount in of tokens to swap',
            },
        ],
    },
    {
        name: 'execute',
        description: 'Executes a swap along with provided inputs',
        required: [...walletRequiredProps, 'commandList'],
        props: [
            ...walletProps,
            {
                name: 'commandList',
                type: 'object',
                properties: {
                    commands: {
                        type: 'array',
                        items: {
                            oneOf: [
                                swapObject,
                                {
                                    description: 'Command: V3 swap exact out',
                                    type: 'object',
                                    properties: {
                                        commandCode: { const: '01' },
                                        recipient: { type: 'string' },
                                        amountOut: { type: 'string' },
                                        amountInMax: { type: 'string' },
                                        path: { type: 'string' },
                                        payerIsUser: { type: 'boolean' }
                                    },
                                    required: ['commandCode', 'recipient', 'amountOut', 'amountInMax', 'path', 'payerIsUser'],
                                },
                                {
                                    description: 'Command: Permit2 transfer from',
                                    type: 'object',
                                    properties: {
                                        commandCode: { const: '02' },
                                        token: { type: 'string' },
                                        recipient: { type: 'string' },
                                        amount: { type: 'string' },
                                    },
                                    required: ['commandCode', 'token', 'recipient', 'amount'],
                                },
                                {
                                    description: 'Command: Permit2 permit batch',
                                    type: 'object',
                                    properties: {
                                        commandCode: { const: '03' },
                                        permits: {
                                            type: 'array',
                                            items: permitObject,
                                        },
                                        spender: { type: 'string' },
                                        sigDeadline: { type: 'string' },
                                    },
                                    required: ['commandCode', 'permits', 'spender', 'sigDeadline'],
                                },
                                {
                                    description: 'Command: Sweep',
                                    type: 'object',
                                    properties: {
                                        commandCode: { const: '04' },
                                        token: { type: 'string' },
                                        recipient: { type: 'string' },
                                        amountMin: { type: 'string' },
                                    },
                                    required: ['commandCode', 'token', 'recipient', 'amountMin'],
                                },
                                {
                                    description: 'Command: Transfer',
                                    type: 'object',
                                    properties: {
                                        commandCode: { const: '05' },
                                        token: { type: 'string' },
                                        recipient: { type: 'string' },
                                        value: { type: 'string' },
                                    },
                                    required: ['commandCode', 'token', 'recipient', 'value'],
                                },
                                {
                                    description: 'Command: Pay portion',
                                    type: 'object',
                                    properties: {
                                        commandCode: { const: '06' },
                                        token: { type: 'string' },
                                        recipient: { type: 'string' },
                                        bips: { type: 'string' },
                                    },
                                    required: ['commandCode', 'token', 'recipient', 'bips'],
                                },
                                {
                                    description: 'Command: V2 swap exact in',
                                    type: 'object',
                                    properties: {
                                        commandCode: { const: '08' },
                                        recipient: { type: 'string' },
                                        amountIn: { type: 'string' },
                                        amountOutMin: { type: 'string' },
                                        routes: {
                                            type: 'array',
                                            items: routeObject,
                                        },
                                        payerIsUser: { type: 'boolean' },
                                    },
                                    required: ['commandCode', 'recipient', 'amountIn', 'amountOutMin', 'routes', 'payerIsUser'],
                                },
                                {
                                    description: 'Command: V2 swap exact out',
                                    type: 'object',
                                    properties: {
                                        commandCode: { const: '09' },
                                        recipient: { type: 'string' },
                                        amountOut: { type: 'string' },
                                        amountInMax: { type: 'string' },
                                        routes: {
                                            type: 'array',
                                            items: routeObject,
                                        },
                                        payerIsUser: { type: 'boolean' },
                                    },
                                    required: ['commandCode', 'recipient', 'amountOut', 'amountInMax', 'routes', 'payerIsUser'],
                                },
                                {
                                    description: 'Command: Permit2 permit',
                                    type: 'object',
                                    properties: {
                                        commandCode: { const: '0a' },
                                        permit: permitObject,
                                        spender: { type: 'string' },
                                        sigDeadline: { type: 'string' },
                                    },
                                    required: ['commandCode', 'permit', 'spender', 'sigDeadline'],
                                },
                                {
                                    description: 'Command: Wrap ETH',
                                    type: 'object',
                                    properties: {
                                        commandCode: { const: '0b' },
                                        recipient: { type: 'string' },
                                        amountMin: { type: 'string' },
                                    },
                                    required: ['commandCode', 'recipient', 'amountMin'],
                                },
                                {
                                    description: 'Command: Unwrap wETH',
                                    type: 'object',
                                    properties: {
                                        commandCode: { const: '0c' },
                                        recipient: { type: 'string' },
                                        amountMin: { type: 'string' },
                                    },
                                    required: ['commandCode', 'recipient', 'amountMin'],
                                },
                                {
                                    description: 'Command: Permit2 transfer from batch',
                                    type: 'object',
                                    properties: {
                                        commandCode: { const: '0d' },
                                        transfers: {
                                            type: 'array',
                                            items: allowanceTransferObject,
                                        },
                                    },
                                    required: ['commandCode', 'transfers'],
                                },
                                {
                                    description: 'Command: Balance check ERC20',
                                    type: 'object',
                                    properties: {
                                        commandCode: { const: '0e' },
                                        owner: { type: 'string' },
                                        token: { type: 'string' },
                                        minBalance: { type: 'string' },
                                    },
                                    required: ['commandCode', 'owner', 'token', 'minBalance'],
                                },
                                {
                                    description: 'Command: Check owner for ERC721',
                                    type: 'object',
                                    properties: {
                                        commandCode: { const: '15' },
                                        owner: { type: 'string' },
                                        token: { type: 'string' },
                                        id: { type: 'string' },
                                    },
                                    required: ['commandCode', 'owner', 'token', 'id'],
                                },
                                {
                                    description: 'Command: Check owner for ERC1155',
                                    type: 'object',
                                    properties: {
                                        commandCode: { const: '16' },
                                        owner: { type: 'string' },
                                        token: { type: 'string' },
                                        id: { type: 'string' },
                                        minBalance: { type: 'string' },
                                    },
                                    required: ['commandCode', 'owner', 'token', 'id', 'minBalance'],
                                },
                                {
                                    description: 'Command: Sweep ERC721',
                                    type: 'object',
                                    properties: {
                                        commandCode: { const: '17' },
                                        token: { type: 'string' },
                                        recipient: { type: 'string' },
                                        id: { type: 'string' },
                                    },
                                    required: ['commandCode', 'token', 'recipient', 'id'],
                                },
                                {
                                    description: 'Command: Sweep ERC1155',
                                    type: 'object',
                                    properties: {
                                        commandCode: { const: '1d' },
                                        token: { type: 'string' },
                                        recipient: { type: 'string' },
                                        id: { type: 'string' },
                                        amount: { type: 'string' },
                                    },
                                    required: ['commandCode', 'token', 'recipient', 'id', 'amount'],
                                },
                                {
                                    description: 'Command: Approve ERC20',
                                    type: 'object',
                                    properties: {
                                        commandCode: { const: '22' },
                                        token: { type: 'string' },
                                        spender: { type: 'string' },
                                    },
                                    required: ['commandCode', 'token', 'spender'],
                                },
                            ],
                        },
                    },
                },
                description:
                    'Object containing list of commands with arguments to perform. ' +
                    'Example swap from ETH to AERO can consists of Wrapping ETH and ' +
                    'swapping through different pools over V3 and / or V2 version of protocol',
            },
        ],
    },
    {
        name: 'swap',
        description: 'Performs token swap on given path. Uses path from `getPath` for tokens and fees.',
        required: [...walletRequiredProps, 'swap'],
        props: [...walletProps, swapProps],
    },
    {
        name: 'getPool',
        description: 'Retrieve and return pool address for tokens and fee',
        required: [...walletRequiredProps, 'token0', 'token1', 'fees'],
        props: [
            ...walletProps,
            {
                name: 'token0',
                type: 'string',
                description: 'Token which you want swap from.',
            },
            {
                name: 'token1',
                type: 'string',
                description: 'Token which you want swap to.',
            },
            {
                name: 'fee',
                type: 'string',
                description: 'Fee for the pool. Usually value with most liquidity is `500`.',
            },
        ],
    },
    {
        name: 'getPath',
        description: 'Builds and returns path for swaps. Should be build from tokens and fees',
        required: [...walletRequiredProps, 'tokens', 'fees'],
        props: [
            ...walletProps,
            {
                name: 'tokens',
                type: 'array',
                items: { type: 'string' },
                description: 'List of tokens between which you want to swap. There should be at least 2. Between each consecutive tokens there should be a pool.',
            },
            {
                name: 'fees',
                type: 'array',
                items: { type: 'string' },
                description:
                    'List of fees between each consecutive tokens. The fees are ordered and apply to each consecutive token pair fe. `fee[0]` would apply to pair of `tokens[0]` and `tokens[1]`',
            },
        ],
    }
];
