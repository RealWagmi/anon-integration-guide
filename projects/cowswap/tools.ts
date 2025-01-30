import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'cancelOrders',
        description: 'Cancels pending orders.',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute the this function.',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that made the orders.',
            },
            {
                name: 'orderUids',
                type: 'string[]',
                description: 'List of the orderUids',
            },
        ],
    },
    {
        name: 'getOrders',
        description: 'Get all the orders made by this account.',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute the this function.',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that has the orders.',
            },
        ],
    },
    {
        name: 'getOrderCompletionStatus',
        description: 'Get the order status of the orderUid',
        required: ['chainName', 'account', 'orderUid'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute the this function.',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that made the order.',
            },
            {
                name: 'orderUid',
                type: 'string',
                description: 'The unique identifier of the order.',
            },
        ],
    },
    {
        name: 'postSwapOrder',
        description: 'Posts the swap order.',
        required: ['chainName', 'account', 'amount', 'receiver', 'inputToken', 'outputToken'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute the this function.',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will execute the swap',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'The amount of `inputToken` that will be used to buy `ouputToken`s',
            },
            {
                name: 'receiver',
                type: 'string',
                description: 'Optional address to specify the receiver of the outputToken this defaults to `account` if not specified.',
            },
            {
                name: 'inputToken',
                type: 'string',
                description: 'The token that will be sold to obtain the `outputToken`',
            },
            {
                name: 'outputToken',
                type: 'string',
                description: 'The token that will be bought in exchange for the `inputToken`',
            },
        ],
    },
];
