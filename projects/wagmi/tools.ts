import { sWagmiSupportedChains } from './constants';
import { AiTool, getChainName } from '@heyanon/sdk';

export const tools = [
    {
        name: 'stake',
        description: 'Staking token Wagmi to token sWagmi',
        required: ['chainName', 'account', 'amount'],
        props: [
            { name: 'chainName', type: 'string', enum: sWagmiSupportedChains.map(getChainName) },
            { name: 'account', type: 'string', description: 'The user account address' },
            { name: 'amount', type: 'string', description: 'The amount of tokens to stake in decimal format. Use "-1" for all balance' },
        ],
    },
] satisfies AiTool[];
