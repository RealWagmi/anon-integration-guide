import { AiTool, EVM } from '@heyanon/sdk';
import { MAX_VAULTS_IN_RESULTS, supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'depositExactTokens',
        description: 'Deposit an exact amount of tokens into a vault.',
        required: ['chainName', 'account', 'vaultId', 'amount', 'tokenAddress'],
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
            {
                name: 'vaultId',
                type: 'string',
                description: 'ID of the vault to deposit into, for example "beetsv3-sonic-beefyusdce-scusd"',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens to deposit, in decimal form (e.g. "1.5 ETH" instead of 1.5e18)',
            },
            {
                name: 'tokenAddress',
                type: 'string',
                description: 'Address of the token to deposit, starting with "0x".  Must correspond to the token in the vault.',
            },
        ],
    },
    {
        name: 'depositDollarAmount',
        description: 'Deposit the given amount of US dollars ($) in the given vault.',
        required: ['chainName', 'account', 'vaultId', 'dollarAmount'],
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
            {
                name: 'vaultId',
                type: 'string',
                description: 'ID of the vault to deposit into, for example "beetsv3-sonic-beefyusdce-scusd"',
            },
            {
                name: 'dollarAmount',
                type: 'number',
                description: 'Amount to deposit expressed in dollars, e.g. 100.5 for $100.50 or 1000 for $1000',
            },
        ],
    },
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
    {
        name: 'getVaultInfoFromVaultName',
        description:
            'Find a vault by its name and return detailed information about it, including the APY yield, the TVL and any positions in the vault belonging to the user.  In case of multiple matches, an error is returned contaninig the TVL-ordered list of vaults.',
        required: ['chainName', 'account', 'vaultName'],
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
                name: 'vaultName',
                type: 'string',
                description: 'Name of the vault to search for, for example "Boosted Stable Rings".  The search is case-insensitive, with partial matches allowed.',
            },
        ],
    },
];
