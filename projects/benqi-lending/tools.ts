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

const amountProps = [
    {
        name: 'amount',
        type: 'string',
        description: 'Amount of tokens in decimal format',
    },
];

const amountRequiredProps = ['amount'];

const marketTypeProps = [
    {
        name: 'marketType',
        type: 'string',
        enum: ['core', 'ecosystem'],
        description: 'Market type used for transaction',
    },
];

const marketProps = [
    ...marketTypeProps,
    {
        name: 'marketName',
        type: 'string',
        description:
            'Market name used for transaction. For core market type those can be AVAX, sAVAX, BTCb, BTC, ETH, LINK, USDT, USDC, USDTn, USDCn, DAI, BUSD, QI, AUSD and for ecosystem market type USDC, COQ, JOE, QI, AUSD, SolvBTC',
    },
];

const marketRequiredProps = ['marketType', 'marketName'];

const marketListProps = [
    ...marketTypeProps,
    {
        name: 'marketNames',
        type: 'array',
        items: { type: 'string' },
        description:
            'Market names used for transaction. For core market type those can be AVAX, sAVAX, BTCb, BTC, ETH, LINK, USDT, USDC, USDTn, USDCn, DAI, BUSD, QI, AUSD and for ecosystem market type USDC, COQ, JOE, QI, AUSD, SolvBTC',
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
        name: 'exitMarket',
        description: 'Enters a list of markets on the specified chain for the given account.',
        required: [...walletRequiredProps, ...marketRequiredProps],
        props: [...walletProps, ...marketProps],
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
    {
        name: 'getAccountLiquidity',
        description: 'Get account liquidity in USD',
        required: [...walletRequiredProps, 'marketType'],
        props: [...walletProps, ...marketTypeProps],
    },
    {
        name: 'getMarketBorrowLimit',
        description: 'Get specified market borrow limit.',
        required: [...walletRequiredProps, ...marketRequiredProps],
        props: [...walletProps, ...marketProps],
    },
];
