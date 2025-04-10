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
        description: 'Opens a new perp position on Hyperliquid. If vault is provided, the position is opened under that vault.',
        required: ['account', 'asset', 'size', 'sizeUnit', 'leverage', 'short'],
        props: [
            { name: 'account', type: 'string', description: 'User wallet address that will open the perp position.' },
            { name: 'asset', type: 'string', enum: Object.keys(hyperliquidPerps), description: 'Name of the underlying asset for the perp position.' },
            { name: 'size', type: 'string', description: 'Size of the position (interpreted in asset units or USD depending on sizeUnit).' },
            { name: 'sizeUnit', type: 'string', enum: ['ASSET', 'USD'], description: 'Specifies whether the size is denominated in asset units or in USD.' },
            { name: 'leverage', type: 'number', description: 'Leverage multiplier for the position.' },
            { name: 'short', type: 'boolean', description: 'If true, opens a short position; if false, opens a long position.' },
            {
                name: 'limitPrice',
                type: 'string',
                description:
                    "Optional. Only used in the case when it was explicitly specified that limit order needs to be opened at a specific price, or a specific price is specified, which represents the worst price the order should be accepted for. When limit order for a price / worst price is specified for, it is then provided as this field's value. ",
            },
            {
                name: 'takeProfitPrice',
                type: 'string',
                description:
                    'Optional. Only used in the case when it was explicitly specified that user wants to have "Take profit" enabled for the position, and what price does the asset need to reach in order for position to be closed. (In case user specifies something other than the asset price at which to do the take profit (e.g. the profit amount when to take it), it is invalid input and this function should not be called). ',
            },
            {
                name: 'stopLossPrice',
                type: 'string',
                description:
                    'Optional. Only used in the case when it was explicitly specified that user wants to have "Stop loss" enabled for the position, and what price does the asset need to reach in order for position to be closed. (In case user specifies something other than the asset price at which to do the stop loss (e.g. the loss amount it needs to reach for stopping it), it is invalid input and this function should not be called). ',
            },
            { name: 'vault', type: 'string', description: 'Optional. Vault name or address.' },
        ],
    },
    {
        name: 'modifyPerpPositionByUSD',
        description:
            'Increses or decreases (adds to or removes from) the size of the Hyperliquid perp position by the specified USD amount. In case that position size needs to be increased, "size" argument is positive, and otherwise it is negative. If vault is provided, the action executes as that vault.',
        required: ['account', 'asset', 'size'],
        props: [
            { name: 'account', type: 'string', description: 'User wallet address that will have its perp position modified.' },
            { name: 'asset', type: 'string', enum: Object.keys(hyperliquidPerps), description: 'Name of the underlying asset of the perp position.' },
            { name: 'size', type: 'string', description: 'How many USD the position needs to be increased for. Positive for size increase and negative for size decrease.' },
            {
                name: 'limitPrice',
                type: 'string',
                description:
                    "Optional. Only used in the case when it was explicitly specified that limit order needs to be opened at a specific price, or a specific price is specified, which represents the worst price the order should be accepted for. When limit order for a price / worst price is specified for, it is then provided as this field's value. ",
            },
            { name: 'vault', type: 'string', description: 'Optional. Vault name or address.' },
        ],
    },
    {
        name: 'modifyPerpPositionByTokenAmount',
        description:
            'Increses or decreases (adds to or removes from) the size of the Hyperliquid perpetual position by the specified asset token amount. In case that position size needs to be increased, "size" argument is positive, and otherwise it is negative. If vault is provided, the action executes as that vault.',
        required: ['account', 'asset', 'size'],
        props: [
            { name: 'account', type: 'string', description: 'User wallet address that will have its perp position modified.' },
            { name: 'asset', type: 'string', enum: Object.keys(hyperliquidPerps), description: 'Name of the underlying asset of the perp position.' },
            {
                name: 'size',
                type: 'string',
                description: 'Amount of underlying token that the position needs to be increased for. Positive for size increase and negative for size decrease.',
            },
            {
                name: 'limitPrice',
                type: 'string',
                description:
                    "Optional. Only used in the case when it was explicitly specified that limit order needs to be opened at a specific price, or a specific price is specified, which represents the worst price the order should be accepted for. When limit order for a price / worst price is specified for, it is then provided as this field's value. ",
            },
            { name: 'vault', type: 'string', description: 'Optional. Vault name or address.' },
        ],
    },
    {
        name: 'increasePerpPositionByMultiplying',
        description:
            'When user wants the position size to be increased by a percentage or by a multiplier, or increased to some percentage, this function gets called. If vault is provided, the action executes as that vault.',
        required: ['account', 'asset', 'sizeMultiplier'],
        props: [
            { name: 'account', type: 'string', description: 'User wallet address that will have its perp position increased.' },
            { name: 'asset', type: 'string', enum: Object.keys(hyperliquidPerps), description: 'Name of the underlying asset of the perp position.' },
            { name: 'sizeMultiplier', type: 'string', description: 'Multiplier to increase the position (e.g., 1.5 to increase by 50%).' },
            {
                name: 'limitPrice',
                type: 'string',
                description:
                    "Optional. Only used in the case when it was explicitly specified that limit order needs to be opened at a specific price, or a specific price is specified, which represents the worst price the order should be accepted for. When limit order for a price / worst price is specified for, it is then provided as this field's value. ",
            },
            { name: 'vault', type: 'string', description: 'Optional. Vault name or address.' },
        ],
    },
    {
        name: 'decreasePerpPositionByMultiplying',
        description:
            'When user wants the position size to be decreased by a percentage or by a multiplier, or decreased to some percentage, this function gets called. If vault is provided, the action executes as that vault.',
        required: ['account', 'asset', 'sizeMultiplier'],
        props: [
            { name: 'account', type: 'string', description: 'User wallet address whose perp position will be decreased.' },
            { name: 'asset', type: 'string', enum: Object.keys(hyperliquidPerps), description: 'Name of the underlying asset of the perp position.' },
            { name: 'sizeMultiplier', type: 'string', description: 'Multiplier to decrease the position (e.g., 0.5 to reduce by 50%).' },
            {
                name: 'limitPrice',
                type: 'string',
                description:
                    "Optional. Only used in the case when it was explicitly specified that limit order needs to be opened at a specific price, or a specific price is specified, which represents the worst price the order should be accepted for. When limit order for a price / worst price is specified for, it is then provided as this field's value. ",
            },
            { name: 'vault', type: 'string', description: 'Optional. Vault name or address.' },
        ],
    },
    {
        name: 'closePerp',
        description: 'Closes an existing perp position on Hyperliquid. If vault is provided, the action executes as that vault.',
        required: ['account', 'asset'],
        props: [
            { name: 'account', type: 'string', description: 'User wallet address that will close the perp position.' },
            {
                name: 'asset',
                type: 'string',
                enum: Object.keys(hyperliquidPerps),
                description: 'Name of the underlying asset whose perp position should be closed.',
            },
            {
                name: 'limitPrice',
                type: 'string',
                description:
                    "Optional. Only used in the case when it was explicitly specified that limit order needs to be opened at a specific price, or a specific price is specified, which represents the worst price the order should be accepted for. When limit order for a price / worst price is specified for, it is then provided as this field's value. ",
            },
            { name: 'vault', type: 'string', description: 'Optional. Vault name or address.' },
        ],
    },
    {
        name: 'cancelOrder',
        description: 'Cancels the existing open order on Hyperliquid based on its ID (oid).',
        required: ['account', 'id'],
        props: [
            { name: 'account', type: 'string', description: 'User wallet address that will cancel the order.' },
            {
                name: 'id',
                type: 'number',
                description: 'Order ID (oid) of the order to be closed.',
            },
            { name: 'vault', type: 'string', description: 'Optional. Vault name or address.' },
        ],
    },
    {
        name: 'addStopLoss',
        description: 'Adds stop loss trigger at the given price to the existing Hyperliquid position in the given asset.',
        required: ['account', 'asset', 'price'],
        props: [
            { name: 'account', type: 'string', description: 'User wallet address that will cancel the order.' },
            { name: 'asset', type: 'string', enum: Object.keys(hyperliquidPerps), description: 'Name of the underlying asset of the perp position.' },
            {
                name: 'price',
                type: 'string',
                description: 'Trigger price for the stop loss action.',
            },
            { name: 'vault', type: 'string', description: 'Optional. Vault name or address.' },
        ],
    },
    {
        name: 'addTakeProfit',
        description: 'Adds take profit trigger at the given price to the existing Hyperliquid position in the given asset.',
        required: ['account', 'asset', 'price'],
        props: [
            { name: 'account', type: 'string', description: 'User wallet address that will cancel the order.' },
            { name: 'asset', type: 'string', enum: Object.keys(hyperliquidPerps), description: 'Name of the underlying asset of the perp position.' },
            {
                name: 'price',
                type: 'string',
                description: 'Trigger price for the take profit action.',
            },
            { name: 'vault', type: 'string', description: 'Optional. Vault name or address.' },
        ],
    },
    {
        name: 'getPerpPositions',
        description:
            "Retrieves user's perpetual positions on Hyperliquid. This function is ONLY used for retreiving data, and it does not modify any of the positions. This function should be called ONLY if it has been explicitly stated that list of user's perp positions is needed. DON'T call this function if some change is explicitly asked for. If vault is provided, retrieves positions for that vault.  NEVER CALL THIS FUNCTION IF SOMETHING ELSE IS NEEDED! ",
        required: ['account'],
        props: [
            { name: 'account', type: 'string', description: 'User wallet address to check for perpetual positions.' },
            { name: 'vault', type: 'string', description: 'Optional. Vault name or address.' },
        ],
    },
    {
        name: 'getOpenOrders',
        description:
            "Retrieves the list of user's currently open orders on Hyperliquid. This function is ONLY used for retreiving data, and it does not modify any of the positions. This function should be called ONLY if it has been explicitly stated that list of user's list of pending orders is needed. DON'T call this function if some change is explicitly asked for. If vault is provided, retrieves positions for that vault.  NEVER CALL THIS FUNCTION IF SOMETHING ELSE IS NEEDED! ",
        required: ['account'],
        props: [
            { name: 'account', type: 'string', description: 'User wallet address to check for open orders' },
            { name: 'vault', type: 'string', description: 'Optional. Vault name or address.' },
        ],
    },
    {
        name: 'getSpotBalances',
        description:
            "Retrieves user's spot balances on Hyperliquid. This function is ONLY used for retreiving data, and it does not modify any of the spot balances. This function should be called ONLY if it has been explicitly stated that list of user's spot assets is needed. DON'T call this function if some change is explicitly asked for. NEVER CALL THIS FUNCTION IF SOMETHING ELSE IS NEEDED! Vaults do not have spot balances and this function should not be called for them.",
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
            "Retrieves user's available balance (USDC/USD) in their Hyperliquid perpetual account. This function is ONLY used for retreiving data, and it does not modify the perpetual account balance. This function should be called ONLY if it has been explicitly stated that his balance of hyperliquid perp account is needed. DON'T call this function if some change is explicitly asked for. If vault is provided, retrieves the balance for that vault. NEVER CALL THIS FUNCTION IF SOMETHING ELSE IS NEEDED! ",
        required: ['account'],
        props: [
            { name: 'account', type: 'string', description: 'User wallet address to check for perpetual balance.' },
            { name: 'vault', type: 'string', description: 'Optional. Vault name or address.' },
        ],
    },
    {
        name: 'addMargin',
        description:
            'If word "margin" has not been mentioned in the prompt text, this function should not be called. Increases the position margin by adding funds to it. It decreases the liquidation risk. NEVER CALL THIS FUNCTION IF WORD "MARGIN" IS NOT EXPLICITLY MENTIONED!!! Please do not call this function if word "margin" is not in the prompt.',
        required: ['account', 'asset', 'amount'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'If word "margin" has not been mentioned in the prompt text, this function should not be called. The address of the user who is adding the margin.',
            },
            {
                name: 'asset',
                type: 'string',
                description:
                    'If word "margin" has not been mentioned in the prompt text, this function should not be called. Asset identifier of the position that user wants to add margin to.',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'If word "margin" has not been mentioned in the prompt text, this function should not be called. Amount of USD to add to the margin.',
            },
            {
                name: 'vault',
                type: 'string',
                description: 'If word "margin" has not been mentioned in the prompt text, this function should not be called. Optional. Vault name or address.',
            },
            {
                name: 'word_margin_explicitly_mentioned',
                type: 'string',
                enum: ['yes', 'no'],
                description:
                    'If word "Margin" was not explicitly mentioned, this function should not be executed. Explicitly means that in lowercase version of the prompt, there is a substring "margin". This should not be "yes" if the user wants USD added to position (see that the word "margin" was not specified there). If this would be "no", this functions should not be called. ',
            },
        ],
    },
    {
        name: 'removeMargin',
        description:
            'If word "margin" has not been mentioned in the prompt text, this function should not be called. Decreases the position margin by removing funds from it so they can be used someplace else. NEVER CALL THIS FUNCTION IF WORD "MARGIN" IS NOT EXPLICITLY MENTIONED!!! Please do not call this function if word "margin" is not in the prompt.',
        required: ['account', 'asset', 'amount'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'If word "margin" has not been mentioned in the prompt text, this function should not be called. The address of the user who is removing the margin.',
            },
            {
                name: 'asset',
                type: 'string',
                enum: Object.keys(hyperliquidPerps),
                description:
                    'If word "margin" has not been mentioned in the prompt text, this function should not be called. Asset identifier of the position that user wants to remove margin from.',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'If word "margin" has not been mentioned in the prompt text, this function should not be called. Amount of USD to remove from the margin.',
            },
            {
                name: 'vault',
                type: 'string',
                description: 'If word "margin" has not been mentioned in the prompt text, this function should not be called. Optional. Vault name or address.',
            },
            {
                name: 'word_margin_explicitly_mentioned',
                type: 'string',
                enum: ['yes', 'no'],
                description:
                    'If word "Margin" was not explicitly mentioned, this function should not be executed. Explicitly means that in lowercase version of the prompt, there is a substring "margin. "This should not be "yes" if the user wants USD added to position (see that the word "margin" was not specified there). If this would be "no", this functions should not be called. ',
            },
        ],
    },
    {
        name: 'createVault',
        description: 'Creates a new vault on Hyperliquid by signing and submitting a typed data transaction.',
        required: ['account', 'description', 'initialUsd', 'name'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'The address of the user who is creating the vault.',
            },
            {
                name: 'description',
                type: 'string',
                description: 'A description for the vault.',
            },
            {
                name: 'initialUsd',
                type: 'string',
                description: 'Initial amount of USD in the vault.',
            },
            {
                name: 'name',
                type: 'string',
                description: 'Name of the vault.',
            },
        ],
    },
    {
        name: 'withdrawFromVault',
        description: 'Withdraws funds from the vault that the user has deposited into previously.',
        required: ['account', 'vault', 'usd'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: "User's wallet address.",
            },
            {
                name: 'vault',
                type: 'string',
                description: "Vault's name or address from which to withdraw funds.",
            },
            {
                name: 'usd',
                type: 'string',
                description: 'USD amount that should be withdrawn.',
            },
        ],
    },
    {
        name: 'closeVault',
        description: 'Closes an existing vault on Hyperliquid.',
        required: ['account', 'vault'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: "User's wallet address.",
            },
            {
                name: 'vault',
                type: 'string',
                description: 'Vault name or address to be closed.',
            },
        ],
    },
    {
        name: 'distributeVault',
        description:
            "Distributes (or shares) a portion of the vault's perpetual USD balance to its depositors (shareholders, guys who deposited/invested in vault), proportionally to their share.",
        required: ['account', 'vault', 'usd'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: "Vault manager's wallet address.",
            },
            {
                name: 'vault',
                type: 'string',
                description: 'Vault name or address from which the funds are distributed.',
            },
            {
                name: 'usd',
                type: 'string',
                description: 'USD amount to be distributed among the vault depositors.',
            },
        ],
    },
    {
        name: 'depositIntoVault',
        description: "Deposits funds from the user's perpetual balance into the specified vault.",
        required: ['account', 'vault', 'usd'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: "User's wallet address.",
            },
            {
                name: 'vault',
                type: 'string',
                description: 'Vault name or address into which funds will be deposited.',
            },
            {
                name: 'usd',
                type: 'string',
                description: 'Amount to deposit (in USD).',
            },
        ],
    },
    {
        name: 'getUsersVaults',
        description: 'Retrieves the list of all active vaults that the user manages.',
        required: ['account'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: "User's wallet address.",
            },
        ],
    },
    {
        name: 'toggleAutoCloseOnWithdrawal',
        description: "Toggles whether the vault's positions should automatically close on withdrawal.",
        required: ['account', 'vault', 'value'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: "User's wallet address.",
            },
            {
                name: 'vault',
                type: 'string',
                description: 'Vault name or address.',
            },
            {
                name: 'value',
                type: 'boolean',
                description: 'Set to true to enable auto-close on withdrawal; false to disable.',
            },
        ],
    },
    {
        name: 'toggleDepositsEnabled',
        description: 'Toggles whether users are allowed to deposit into the vault.',
        required: ['account', 'vault', 'value'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: "User's wallet address.",
            },
            {
                name: 'vault',
                type: 'string',
                description: 'Vault name or address.',
            },
            {
                name: 'value',
                type: 'boolean',
                description: 'Set to true to enable deposits into the vault; false to disable.',
            },
        ],
    },
    {
        name: 'getFundingRate',
        description:
            'Fetches the current funding rate for one specific asset on Hyperliquid. Use this tool ONLY when a user explicitly asks for the current funding rate of a single asset (e.g., "What’s the current funding rate for ETH?"). Do NOT use for historical rates or multiple assets.',
        required: ['asset'],
        props: [
            {
                name: 'asset',
                type: 'string',
                enum: Object.keys(hyperliquidPerps),
                description: 'The asset to get the current funding rate for (e.g., "BTC", "ETH"). Must be a valid Hyperliquid perpetual asset.',
            },
        ],
    },
    {
        name: 'getHistoricalFundingRates',
        description:
            'Fetches past funding rates for one specific asset on Hyperliquid over a time range. Use this tool ONLY when a user explicitly asks for the historical funding rate history of a single asset (e.g., "Show me BTC funding rates for the last week"). Do NOT use for current rates or multiple assets.',
        required: ['asset'],
        props: [
            {
                name: 'asset',
                type: 'string',
                enum: Object.keys(hyperliquidPerps),
                description: 'The asset to get historical funding rates for (e.g., "BTC", "ETH"). Must be a valid Hyperliquid perpetual asset.',
            },
            {
                name: 'timeRange',
                type: 'string',
                description:
                    'Optional. Time range for the rates in the format "<number><unit>" (e.g., "1h" for 1 hour, "8h" for 8 hours, "1w" for 1 week, "1m" for 1 month). Defaults to "24h" if omitted.',
            },
        ],
    },
    {
        name: 'getSortedHistoricalFundingRates',
        description:
            'Fetches and sorts average funding rates for ALL Hyperliquid assets over a time range. Use this tool ONLY when a user explicitly asks for a sorted list of average funding rates across all assets (e.g., "List all funding rates sorted for the last day"). Do NOT use for a single asset or current rates.',
        required: [],
        props: [
            {
                name: 'timeRange',
                type: 'string',
                description:
                    'Optional. Time range for the rates in the format "<number><unit>" (e.g., "1h" for 1 hour, "8h" for 8 hours, "1w" for 1 week, "1m" for 1 month). Defaults to "24h" if omitted.',
            },
        ],
    },
];
