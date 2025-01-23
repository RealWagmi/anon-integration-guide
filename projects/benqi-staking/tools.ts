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

const nodesProps = [
    {
        name: 'nodeIds',
        type: 'array',
        items: {
            type: 'string',
            description: 'Validator node ids',
        },
    },
];

const nodesRequiredProps = ['nodeIds'];

const weightsProps = [
    {
        name: 'weights',
        type: 'array',
        items: {
            type: 'string',
            description: 'Validator node weights. Specified as floating point values with up to 2 decimal places in string format',
        },
    },
];

const weightsRequiredProps = ['weights'];

export const tools: AiTool[] = [
    {
        name: 'cancelPendingUnlockRequests',
        description: 'Cancel pending unlock requests in the sAVAX contract',
        required: [...walletRequiredProps],
        props: [...walletProps],
    },
    {
        name: 'getUserVotesLength',
        description: 'Get amount of votes a user has',
        required: [...walletRequiredProps],
        props: [...walletProps],
    },
    {
        name: 'redeemUnstakedAvax',
        description: 'Reedems previously unstaked AVAX from the sAVAX contract',
        required: [...walletRequiredProps],
        props: [...walletProps],
    },
    {
        name: 'stakeAvax',
        description: 'Stakes specified amount of AVAX on the sAVAX contract',
        required: [...walletRequiredProps, ...amountRequiredProps],
        props: [...walletProps, ...amountProps],
    },
    {
        name: 'stakeQi',
        description: 'Stakes specified amount of Qi on the veQi contract',
        required: [...walletRequiredProps, ...amountRequiredProps],
        props: [...walletProps, ...amountProps],
    },
    {
        name: 'unstakeAvax',
        description: 'Unstakes specified amount of AVAX from the sAVAX contract',
        required: [...walletRequiredProps, ...amountRequiredProps],
        props: [...walletProps, ...amountProps],
    },
    {
        name: 'unstakeAvax',
        description: 'Unstakes specified amount of Qi on the veQi contract',
        required: [...walletRequiredProps, ...amountRequiredProps],
        props: [...walletProps, ...amountProps],
    },
    {
        name: 'unvoteNodes',
        description: 'Updates votes for specified nodes. This method will decrease previously existing votes',
        required: [...walletRequiredProps, ...nodesRequiredProps, ...weightsRequiredProps],
        props: [...walletProps, ...nodesProps, ...weightsProps],
    },
    {
        name: 'voteNodes',
        description: 'Updates votes for specified nodes. This method will increase previously existing votes',
        required: [...walletRequiredProps, ...nodesRequiredProps, ...weightsRequiredProps],
        props: [...walletProps, ...nodesProps, ...weightsProps],
    },
];
