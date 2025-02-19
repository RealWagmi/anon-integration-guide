import { AiTool, getChainName } from '@heyanon/sdk';
import { ALL_DURATIONS, ERC20_PAYMENT_METHODS, supportedChains } from './constants';

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

const registerProps = [
    {
        name: 'nodeId',
        type: 'string',
        description: 'Node ID of the validator',
    },
    {
        name: 'blsProofOfPossession',
        type: 'string',
        description: 'BLS proof of possession (public key + signature)',
    },
    {
        name: 'validationDuration',
        type: 'string',
        enum: ALL_DURATIONS,
        description: 'The name of the chain on which the transaction will be executed.',
    },
];

const registerRequiredProps = ['nodeId', 'blsProofOfPossession', 'validationDuration'];

const paymentMethodProps = [
    {
        name: 'paymentMethod',
        type: 'string',
        enum: Object.keys(ERC20_PAYMENT_METHODS),
        description: 'The payment method to use for the transaction.',
    },
];

export const paymentMethodRequiredProps = ['paymentMethod'];

export const tools: AiTool[] = [
    {
        name: 'registerWithAvaxFee',
        description: 'Register nodeId with AVAX.',
        required: [...walletRequiredProps, ...registerRequiredProps],
        props: [...walletProps, ...registerProps],
    },
    {
        name: 'registerWithErc20Fee',
        description: 'Register nodeId with fee paid in ERC20 based currency.',
        required: [...walletRequiredProps, ...registerRequiredProps, ...paymentMethodRequiredProps],
        props: [...walletProps, ...registerProps, ...paymentMethodProps],
    },
    {
        name: 'registerWithStake',
        description: 'Register nodeId with staking fee.',
        required: [...walletRequiredProps, ...registerRequiredProps, ...amountRequiredProps],
        props: [...walletProps, ...registerProps, ...amountProps],
    },
    {
        name: 'redeemAfterExpiry',
        description: 'To be called after the validation period has expired and the staker wants to redeem their deposited tokens and potential rewards.',
        required: [...walletRequiredProps, 'nodeId'],
        props: [
            ...walletProps,
            {
                name: 'nodeId',
                type: 'string',
                description: 'Node ID of the validator',
            },
        ],
    },
    {
        name: 'getRegistrationsByAccount',
        description: 'Lists registrations made by the given account.',
        required: [...walletRequiredProps, 'from', 'to'],
        props: [...walletProps, { name: 'from', type: 'number' }, { name: 'to', type: 'number' }],
    },
    {
        name: 'getAccountRegistrationCount',
        description: 'Returns the number of registrations made by the given account.',
        required: [...walletRequiredProps],
        props: [...walletProps],
    },
];
