import { AiTool, getChainName } from '@heyanon/sdk';
import { QI_MARKETS, supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'depositCollateral',
        description: 'Deposits a specified amount of tokens into the protocol. Necessary first step for borrowing.',
        required: ['chainName', 'account', 'amount', 'market'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to deposit tokens',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will execute transaction',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens for deposit in decimal format',
            },
            {
                name: 'marketName',
                type: 'string',
                enum: Object.keys(QI_MARKETS),
                description: 'Market name used for deposit. See https://docs.benqi.fi/benqi-markets/core-markets for list of available markets',
            },
        ],
    },
];
