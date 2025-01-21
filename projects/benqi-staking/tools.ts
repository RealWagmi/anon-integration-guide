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

export const tools: AiTool[] = [
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
];
