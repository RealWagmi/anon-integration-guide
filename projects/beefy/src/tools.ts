import { AiTool, EVM } from '@heyanon/sdk';
import { MAX_VAULTS_IN_RESULTS, supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'depositExactTokens',
        description: 'Deposit an exact amount of tokens into a vault',
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
                type: ['string', 'null'],
                description: 'Address of the token to deposit, starting with "0x".  Must correspond to the token in the vault.  If null, the vault token will be used.',
            },
        ],
    },
    {
        name: 'depositFractionOfTokens',
        description: "Deposit a percentage of the user's tokens into a vault",
        required: ['chainName', 'account', 'vaultId', 'percentage'],
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
                name: 'percentage',
                type: 'number',
                description: 'Percentage of the user\'s tokens to deposit, expressed as a string (e.g. "50" for 50%)',
            },
        ],
    },
    {
        name: 'depositDollarAmount',
        description:
            'Deposit the given amount of US dollars ($) in the given vault.  The dollar value is converted to an amount of tokens to deposit, based on the current price of the vault token.  IMPORTANT: Stablecoins often have "USD" or "US" in their name, but should be treated as tokens, not dollars.  For example, 100 USDC is not 100 dollars, it is 100 USDC, a stablecoin.',
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
        name: 'withdraw',
        description: "Withdraw a percentage of the user's deposited tokens from a vault.  Omit the removal percentage to withdraw all of the user's tokens.",
        required: ['chainName', 'account', 'vaultId', 'removalPercentage'],
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
                description: 'ID of the vault to withdraw from, for example "beetsv3-sonic-beefyusdce-scusd"',
            },
            {
                name: 'removalPercentage',
                type: ['string', 'null'],
                description: 'Percent of liquidity to remove, expressed as a string (e.g. "50" for 50%). If null, all of the user liquidity will be removed.',
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
        description: `Show the top ${MAX_VAULTS_IN_RESULTS} yield opportunities for the given token, sorted by APY.  NEVER use this function to find the ID of a vault, use findVault instead.`,
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
        name: 'findVault',
        description:
            'Get information about a specific vault by either its ID or its name.  ALWAYS use this function to find the ID of a vault.  The result will include info on any user positions in the vault.',
        required: ['chainName', 'account', 'vaultIdOrName'],
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
                name: 'vaultIdOrName',
                type: 'string',
                description:
                    'ID or name of the vault to get information about, for example "beetsv3-sonic-beefyusdce-scusd" or "Boosted Stable Rings".  The match is case-insensitive.  The ID match is done first, then if no match is found, the name match is done.',
            },
        ],
    },
    {
        name: 'getBeefyCapabilities',
        description: 'Get information about what Beefy can do and example prompts.',
        required: [],
        props: [],
    },
];
