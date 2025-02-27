import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'join',
        description: 'Deposit DAI tokens into the Dai Savings Rate (DSR) pot to earn savings',
        required: ['chainName', 'account', 'destination', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to deposit DAI',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will deposit DAI',
            },
            {
                name: 'destination',
                type: 'string',
                description: 'Destination address for the DSR position',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of DAI tokens to deposit in decimal format',
            },
        ],
    },
    {
        name: 'exit',
        description: 'Withdraw DAI tokens from the Dai Savings Rate (DSR) pot',
        required: ['chainName', 'account', 'destination', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to withdraw DAI',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will withdraw DAI',
            },
            {
                name: 'destination',
                type: 'string',
                description: 'Destination address to receive the withdrawn DAI',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of DAI tokens to withdraw in decimal format',
            },
        ],
    },
    {
        name: 'exitAll',
        description: 'Withdraw all DAI tokens from the Dai Savings Rate (DSR) pots',
        required: ['chainName', 'account', 'destination'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to withdraw DAI',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will withdraw DAI',
            },
            {
                name: 'destination',
                type: 'string',
                description: 'Destination address to receive the withdrawn DAI',
            },
        ],
    },
    {
        name: 'getDaiBalance',
        description: 'Get the total DAI balance in the DSR pot including earned savings',
        required: ['chainName', 'userAddress'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name to check balance',
            },
            {
                name: 'userAddress',
                type: 'string',
                description: 'Address to check DAI balance for',
            },
        ],
    },
];
