import { AiTool, EVM } from '@heyanon/sdk';
import { MAX_VAULTS_IN_RESULTS, supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'getMyPositionsPortfolio',
        description: `Show the top ${MAX_VAULTS_IN_RESULTS} vaults in the user portfolio.  For each vault, show the tokens in the vault, the type of vault, the amounts of tokens, the APR yield, and the dollar value of the vault.`,
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(EVM.utils.getChainName),
                description: 'Chain name',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Address of the user',
            },
        ],
    },
];
