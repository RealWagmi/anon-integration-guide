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
    {
        name: 'getBestApyForUnderlyingToken',
        description: `Show the top ${MAX_VAULTS_IN_RESULTS} vaults with the best APY yield for the given token, sorted by APY.  The returned vaults can contain the token either directly or as part of a liquidity pool.`,
        required: ['chainName', 'tokenAddress'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(EVM.utils.getChainName),
                description: 'Chain name',
            },
            {
                name: 'tokenAddress',
                type: 'string',
                description: 'Address of the token to search for, starting with "0x"',
            },
        ],
    },
];
