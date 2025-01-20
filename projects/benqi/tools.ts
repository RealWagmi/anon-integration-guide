import { AiTool, getChainName } from '@heyanon/sdk';
import { CORE_MARKETS, ECOSYSTEM_MARKETS, supportedChains } from './constants';

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

const amountProps = [
    {
        name: 'amount',
        type: 'string',
        description: 'Amount of tokens in decimal format',
    },
];

const amountRequiredProps = ['amount'];

const marketProps = [
    {
        name: 'marketType',
        type: 'string',
        enum: ['core', 'ecosystem'],
        description: 'Market type used for transaction',
    },
    {
        name: 'marketName',
        type: 'string',
        description:
            'Market name used for transaction. Depending on selected marketType see https://docs.benqi.fi/benqi-markets/core-markets or https://docs.benqi.fi/resources/contracts/core-markets/isolated-markets-avalanche-ecosystem-market for list of available markets',
    },
];

const marketRequiredProps = ['marketType', 'marketName'];

const marketListProps = [
    {
        name: 'marketType',
        type: 'string',
        enum: ['core', 'ecosystem'],
        description: 'Market type used for transaction',
    },
    {
        name: 'marketNames',
        type: 'array',
        items: {
            type: 'string',
            description:
                'Market name used for transaction. Depending on selected marketType see https://docs.benqi.fi/benqi-markets/core-markets or https://docs.benqi.fi/resources/contracts/core-markets/isolated-markets-avalanche-ecosystem-market for list of available markets',
        },
    },
];

const marketListRequiredProps = ['marketType', 'marketNames'];

export const tools: AiTool[] = [
    {
        name: 'borrow',
        description: 'Borrows specified amount of tokens against previously set collateral',
        required: [...walletRequiredProps, ...amountRequiredProps, ...marketRequiredProps],
        props: [...walletProps, ...amountProps, ...marketProps],
    },
    {
        name: 'depositCollateral',
        description: 'Deposits a specified amount of tokens into the protocol. Necessary first step for borrowing.',
        required: [...walletRequiredProps, ...amountRequiredProps, ...marketRequiredProps],
        props: [...walletProps, ...amountProps, ...marketProps],
    },
    {
        name: 'enterMarkets',
        description: 'Enters a list of markets on the specified chain for the given account.',
        required: [...walletRequiredProps, ...marketListRequiredProps],
        props: [...walletProps, ...marketListProps],
    },
    {
        name: 'repayBorrow',
        description: 'Repays a borrowed amount on the specified market.',
        required: [...walletRequiredProps, ...amountRequiredProps, ...marketRequiredProps],
        props: [...walletProps, ...amountProps, ...marketProps],
    },
    {
        name: 'withdrawCollateral',
        description: 'Withdraws a specified amount of tokens from the protocol.',
        required: [...walletRequiredProps, ...amountRequiredProps, ...marketRequiredProps],
        props: [...walletProps, ...amountProps, ...marketProps],
    },
];
