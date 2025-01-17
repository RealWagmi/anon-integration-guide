import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

const baseProps = [
    {
        name: 'chainName',
        type: 'string',
        enum: supportedChains.map(getChainName),
        description: 'Chain name where to execute the transaction',
    },
    {
        name: 'account',
        type: 'string',
        description: 'Account address that will execute the transaction',
    },
    {
        name: 'tokenAddress',
        type: 'string',
        description: 'Address of the token to interact with',
    },
];

const lendProp = [
    {
        name: 'lendAmount',
        type: 'string',
        description: 'Amount of tokens to lend in decimal format',
    },
];

export const tools: AiTool[] = [
    {
        name: 'getLendApr',
        description: 'Get Lend APR for tokens',
        required: ['chainName', 'account', 'tokenAddress'],
        props: baseProps,
    },
    {
        name: 'getBorrowApr',
        description: 'Get Borrow APR for a tokens',
        required: ['chainName', 'account', 'tokenAddress'],
        props: baseProps,
    },
    {
        name: 'lend',
        description: 'Lend assets into the protocol',
        required: ['chainName', 'account', 'tokenAddress', 'lendAmount'],
        props: [...baseProps, ...lendProp],
    },
];
