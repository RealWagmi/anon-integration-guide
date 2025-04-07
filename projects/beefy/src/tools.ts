import { AiTool, EVM } from '@heyanon/sdk';
import { MAX_VAULTS_IN_RESULTS, supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'getMyPositionsPortfolio',
        description: `Show the top ${MAX_VAULTS_IN_RESULTS} vaults in the user portfolio.  For each vault, show the tokens in the vault, the type of vault, the APY yield, and the dollar value of the user position in the vault.`,
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
        name: 'getBestApyForToken',
        description: `Show the top ${MAX_VAULTS_IN_RESULTS} vaults with the best APY yield for the given token, sorted by APY.  By default, vaults where the token is part of a liquidity pool will be included, too.`,
        required: ['chainName', 'tokenAddress', 'noLp'],
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
            {
                name: 'noLp',
                type: ['boolean', 'null'],
                description: 'If true, only include vaults that contain the token directly, thus excluding vaults that only have the token as part of a liquidity pool',
            },
        ],
    },
    {
        name: 'getVaultInfoFromVaultId',
        description: 'Get information about a specific vault, including the AP yield, the TVL, and any positions in the vault belonging to the user.',
        required: ['chainName', 'account', 'vaultId'],
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
                description: 'Address of the user.  The vault info will include info on any user positions in the vault.',
            },
            {
                name: 'vaultId',
                type: 'string',
                description: 'ID of the vault to get information about, for example "beetsv3-sonic-beefyusdce-scusd"',
            },
        ],
    },
];
