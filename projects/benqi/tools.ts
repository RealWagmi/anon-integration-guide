import { AiTool, getChainName } from '@heyanon/sdk';
import { QI_MARKETS, supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'borrow',
        description: 'Borrows specified amount of tokens against previously set collateral',
        required: ['chainName', 'account', 'amount', 'marketName'],
        props: [
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
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens in decimal format',
            },
            {
                name: 'marketName',
                type: 'string',
                enum: Object.keys(QI_MARKETS),
                description: 'Market name from which user wishes to borrow. See https://docs.benqi.fi/benqi-markets/core-markets for list of available markets',
            },
        ],
    },
    {
        name: 'depositCollateral',
        description: 'Deposits a specified amount of tokens into the protocol. Necessary first step for borrowing.',
        required: ['chainName', 'account', 'amount', 'marketName'],
        props: [
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
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens in decimal format',
            },
            {
                name: 'marketName',
                type: 'string',
                enum: Object.keys(QI_MARKETS),
                description: 'Market name used for deposit. See https://docs.benqi.fi/benqi-markets/core-markets for list of available markets',
            },
        ],
    },
    {
        name: 'enterMarkets',
        description: 'Enters a list of markets on the specified chain for the given account.',
        required: ['chainName', 'account', 'marketNames'],
        props: [
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
            {
                name: 'marketName',
                type: 'array',
                items: {
                    type: 'string',
                    enum: supportedChains.map(getChainName),
                },
                description: 'Market names user wishes to enter. See https://docs.benqi.fi/benqi-markets/core-markets for list of available markets',
            },
        ],
    },
    {
        name: 'repayBorrow',
        description: 'Repays a borrowed amount on the specified market.',
        required: ['chainName', 'account', 'amount', 'marketName'],
        props: [
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
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens in decimal format',
            },
            {
                name: 'marketName',
                type: 'string',
                enum: Object.keys(QI_MARKETS),
                description: 'Market name used for repay of the borrow. See https://docs.benqi.fi/benqi-markets/core-markets for list of available markets',
            },
        ],
    },
    {
        name: 'withdrawCollateral',
        description: 'Withdraws a specified amount of tokens from the protocol.',
        required: ['chainName', 'account', 'amount', 'marketName'],
        props: [
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
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens in decimal format',
            },
            {
                name: 'marketName',
                type: 'string',
                enum: Object.keys(QI_MARKETS),
                description: 'Market name used for withdraw. See https://docs.benqi.fi/benqi-markets/core-markets for list of available markets',
            },
        ],
    },
];
