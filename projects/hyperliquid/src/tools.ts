import { AiTool, EVM } from '@heyanon/sdk';
import { hyperliquidPerps, supportedChains } from './constants';

const { getChainName } = EVM.utils;

export const tools: AiTool[] = [
    {
        name: 'bridgeToHyperliquid',
        description: 'Bridges USDC tokens from Arbitrum to Hyperliquid.',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where the bridge transaction is executed. (must be Arbitrum)',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will execute transaction.',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of USDC tokens to bridge. (minimum 5 USDC)',
            },
        ],
    },
    {
        name: 'withdrawFromHyperliquid',
        description: 'Withdraws USDC tokens from Hyperliquid to Arbitrum.',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where the withdraw transaction is executed. (must be Hyperliquid)',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will execute transaction.',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of USDC tokens to withdraw. (minimum 2 USDC)',
            },
        ],
    },
    {
        name: 'transferToPerpetual',
        description: "Transfers funds to user's perpetual trading balance on Hyperliquid (from his spot balance)",
        required: ['amount'],
        props: [
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of USD/USDC to transfer.',
            },
        ],
    },
    {
        name: 'transferToSpot',
        description: "Transfers funds to user's spot balance on Hyperliquid (from his perpetual trading balance)",
        required: ['amount'],
        props: [
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of USD/USDC to transfer.',
            },
        ],
    },
    {
        name: 'openPerp',
        description: 'Opens a new perp position on Hyperliquid.',
        required: ['account', 'asset', 'size', 'sizeUnit', 'leverage', 'short'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'User wallet address that will open the perp position.',
            },
            {
                name: 'asset',
                type: 'string',
                enum: Object.keys(hyperliquidPerps),
                description: 'Name of the underlying asset for the perp position.',
            },
            {
                name: 'size',
                type: 'string',
                description: 'Size of the position (interpreted in asset units or USD, depending on sizeUnit).',
            },
            {
                name: 'sizeUnit',
                type: 'string',
                enum: ['ASSET', 'USD'],
                description: 'Specifies whether "size" is denominated in the asset or in USD.',
            },
            {
                name: 'leverage',
                type: 'number',
                description: 'Leverage multiplier for the position.',
            },
            {
                name: 'short',
                type: 'boolean',
                description: 'If true, opens a short position; if false, opens a long position.',
            },
        ],
    },
    {
        name: 'modifyPerpPositionByUSD',
        description:
            'Increses or decreases the size of the Hyperliquid perp position by the specified USD amount. In case that position size needs to be increased, "size" argument is positive, and otherwise it is negative. ',
        required: ['account', 'asset', 'size'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'User wallet address that will have its perp position modified.',
            },
            {
                name: 'asset',
                type: 'string',
                enum: Object.keys(hyperliquidPerps),
                description: 'Name of the underlying asset of the perp position.',
            },
            {
                name: 'size',
                type: 'string',
                description: 'How many USD the position needs to be increased for. Positive for size increase and negative for size decrease.',
            },
        ],
    },
    {
        name: 'modifyPerpPositionByTokenAmount',
        description:
            'Increses or decreases the size of the Hyperliquid perpetual position by the specified asset token amount. In case that position size needs to be increased, "size" argument is positive, and otherwise it is negative. ',
        required: ['account', 'asset', 'size'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'User wallet address that will have its perp position modified.',
            },
            {
                name: 'asset',
                type: 'string',
                enum: Object.keys(hyperliquidPerps),
                description: 'Name of the underlying asset of the perp position.',
            },
            {
                name: 'size',
                type: 'string',
                description: 'Amount of underlying token that the position needs to be increased for.  Positive for size increase and negative for size decrease. ',
            },
        ],
    },
    {
        name: 'increasePerpPositionByMultiplying',
        description: 'When user wants the position size to be increased by a percentage, this function gets called. ',
        required: ['account', 'asset', 'sizeMultiplier'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'User wallet address that will have its perp position increased.',
            },
            {
                name: 'asset',
                type: 'string',
                enum: Object.keys(hyperliquidPerps),
                description: 'Name of the underlying asset of the perp position.',
            },
            {
                name: 'sizeMultiplier',
                type: 'string',
                description: 'Multiplier that determines how much of the position needs to be increased. (e.g. 3 if user wants to triple the position size, or 1.5 if it needs to be increased by 50%)',
            },
        ],
    },
    {
        name: 'decreasePerpPositionByMultiplying',
        description: 'When user wants the position size to be decreased by a percentage, this function gets called. ',
        required: ['account', 'asset', 'sizeMultiplier'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'User wallet address that will have its perp position decreased.',
            },
            {
                name: 'asset',
                type: 'string',
                enum: Object.keys(hyperliquidPerps),
                description: 'Name of the underlying asset of the perp position.',
            },
            {
                name: 'sizeMultiplier',
                type: 'string',
                description: 'Multiplier that determines how much of the position needs to be decreased. (e.g. 0.5 if it needs to be halved, 0.3 if it needs to be reduced by 70%, and 0.7 if it needs to be lowered to 70%)',
            },
        ],
    },
    {
        name: 'closePerp',
        description: 'Closes an existing perp position on Hyperliquid.',
        required: ['account', 'asset'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'User wallet address that will close the perp position.',
            },
            {
                name: 'asset',
                type: 'string',
                enum: ['ETH', 'BTC', 'HYPE', 'PURR', 'LINK', 'ARB'],
                description: 'Name of the underlying asset whose perp position should be closed.',
            },
        ],
    },
    {
        name: 'getPerpPositions',
        description:
            "Retrieves user's perpetual positions on Hyperliquid. This function is only used for retreiving data, and it does not modify any of the positions. This function should be called only if it has been explicitly stated that list of user's perp positions is needed. Don't call this function if some change is explicitly asked for. ",
        required: ['account'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'User wallet address to check for perpetual positions.',
            },
        ],
    },
    {
        name: 'getSpotBalances',
        description:
            "Retrieves user's spot balances on Hyperliquid. This function is only used for retreiving data, and it does not modify any of the spot balances. This function should be called only if it has been explicitly stated that list of user's spot assets is needed. Don't call this function if some change is explicitly asked for.  ",
        required: ['account'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'User wallet address to check for spot balances.',
            },
        ],
    },
    {
        name: 'getPerpBalances',
        description:
            "Retrieves user's available balance in their Hyperliquid perpetual account. This function is only used for retreiving data, and it does not modify the perpetual account balance. This function should be called only if it has been explicitly stated that his balance of hyperliquid perp account is needed. Don't call this function if some change is explicitly asked for.  ",
        required: ['account'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'User wallet address to check for perpetual balance.',
            },
        ],
    },
];
