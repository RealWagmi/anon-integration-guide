import { AiTool, getChainName } from '@heyanon/sdk';
import { ALL_DURATIONS, supportedChains } from './constants';

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

const registerProps = [
    {
        name: 'nodeId',
        type: 'string',
        description: 'Node id used for registration',
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

export const tools: AiTool[] = [
    {
        name: 'registerWithAvaxFee',
        description: 'Register nodeId with AVAX.',
        required: [...walletRequiredProps, ...registerRequiredProps],
        props: [...walletProps, ...registerProps],
    },
];
