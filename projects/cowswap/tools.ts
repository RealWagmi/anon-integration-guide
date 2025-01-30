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
        required: ['chainName', 'account', 'amount', 'inputToken', 'outputToken'],
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
    {
        name: 'postLimitBuyOrder',
        description: 'Posts a limit buy order.',
        required: ['chainName', 'account', 'sellToken', 'sellTokenPrice', 'buyTokenPrice', 'buyToken', 'buyTokenAmount'],
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
                name: 'buyTokenAmount',
                type: 'string',
                description: 'The amount of `buyToken` that will be used to bought when the current price of `buyToken` exceeds the `buyTokenPrice`',
            },
            {
                name: 'sellToken',
                type: 'string',
                description: 'The token that will be sold to obtain the `buyToken`',
            },
            {
                name: 'buyTokenPrice',
                type: 'string',
                description:
                    'The price of the buyToken in US Dollars when this limit order will be triggered. This will happen when the current price of the `buyToken` exceeds this.',
            },
            {
                name: 'sellTokenPrice',
                type: 'string',
                description: 'Current price of the sellToken in US dollars. This must be populated by querying apis.',
            },
        ],
    },
    {
        name: 'postLimitSellOrder',
        description: 'Posts a limit sell order.',
        required: ['chainName', 'account', 'sellToken', 'sellTokenPrice', 'sellTokenAmount', 'buyTokenPrice', 'buyToken'],
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
                name: 'sellTokenAmount',
                type: 'string',
                description: 'The amount of `sellToken` that will be sold when the current price of `sellToken` exceeds the `sellTokenPrice`',
            },
            {
                name: 'sellToken',
                type: 'string',
                description: 'The token that will be sold to obtain the `buyToken`',
            },
            {
                name: 'buyTokenPrice',
                type: 'string',
                description: 'Current price of the buyToken in US dollars. This must be populated by querying apis.',
            },
            {
                name: 'sellTokenPrice',
                type: 'string',
                description:
                    'The price of the sellToken in US Dollars when this limit order will be triggered. This will happen when the current price of the `sellToken` exceeds this.',
            },
        ],
    },
];
