import { AiTool, EVM } from '@heyanon/sdk';
import { supportedChains, supportedPools } from './constants';

const { getChainName } = EVM.utils;

export const tools: AiTool[] = [
	{
		name: 'borrow',
		description: 'Borrow a token from venus lending protocol on a particular chain.',
		required: ['chainName', 'account', 'tokenSymbol', 'amount', 'pool'],
		props: [
			{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Chain name where to execute the transaction' },
			{ name: 'account', type: 'string', description: 'Account address that will execute the transaction' },
			{ name: 'tokenSymbol', type: 'string', description: 'The token symbol that is involved in the transaction.' },
			{ name: 'pool', type: 'string', enum: supportedPools, description: 'The Pool in which the transaction will be executed.' },
			{ name: 'amount', type: 'string', description: 'Amount of tokens in decimal format' },
		],
	},
	{
		name: 'repay',
		description: 'Repay Token the token that was borrowed from venus lending protocol on a particular chain.',
		required: ['chainName', 'account', 'tokenSymbol', 'pool', 'amount', 'isFull'],
		props: [
			{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Chain name where to execute the transaction' },
			{ name: 'account', type: 'string', description: 'Account address that will execute the transaction' },
			{ name: 'tokenSymbol', type: 'string', description: 'The token symbol that is involved in the transaction.' },
			{ name: 'pool', type: 'string', enum: supportedPools, description: 'The Pool in which the transaction will be executed.' },
			{ name: 'amount', type: ['string', 'null'], description: 'Amount of tokens in decimal format' },
			{ name: 'isFull', type: ['boolean', 'null'], description: 'Indicates whether to repay the full borrowed amount' },
		],
	},
	{
		name: 'mintToken',
		description: 'Mint or supply token to venus lending protocol.',
		required: ['chainName', 'account', 'amount', 'tokenSymbol', 'pool'],
		props: [
			{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Chain name where to execute the transaction' },
			{ name: 'account', type: 'string', description: 'Account address that will execute the transaction' },
			{ name: 'tokenSymbol', type: 'string', description: 'The token symbol that is involved in the transaction.' },
			{ name: 'pool', type: 'string', enum: supportedPools, description: 'The Pool in which the transaction will be executed.' },
			{ name: 'amount', type: 'string', description: 'Amount of tokens in decimal format' },
		],
	},
	{
		name: 'getVenusBalance',
		description: 'Return user balance in certain token in venus lending protocol.',
		required: ['chainName', 'account', 'tokenSymbol', 'pool'],
		props: [
			{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Chain name where to execute the transaction' },
			{ name: 'account', type: 'string', description: 'Account address that will execute the transaction' },
			{ name: 'tokenSymbol', type: 'string', description: 'The token symbol to query.' },
			{ name: 'pool', type: 'string', enum: supportedPools, description: 'The pool in which the transaction will be executed.' },
		],
	},
	{
		name: 'redeemUnderlying',
		description: 'redeem the supplied amount of underlying tokens.',
		required: ['chainName', 'account', 'amount', 'tokenSymbol', 'pool'],
		props: [
			{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Chain name where to execute the transaction' },
			{ name: 'account', type: 'string', description: 'Account address that will execute the transaction' },
			{ name: 'tokenSymbol', type: 'string', description: 'The token symbol that is involved in the transaction.' },
			{ name: 'pool', type: 'string', enum: supportedPools, description: 'The Pool in which the transaction will be executed.' },
			{ name: 'amount', type: 'string', description: 'Amount of tokens in decimal format' },
		],
	},
	{
		name: 'enterMarkets',
		description: 'Enable a token as collateral in venus lending protocol for a particular pool.',
		required: ['chainName', 'account', 'tokenSymbol', 'pool'],
		props: [
			{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Chain name where to execute the transaction' },
			{ name: 'account', type: 'string', description: 'Account address that will execute the transaction' },
			{ name: 'tokenSymbol', type: 'string', description: 'The token symbol that is involved in the transaction.' },
			{ name: 'pool', type: 'string', enum: supportedPools, description: 'The Pool in which the transaction will be executed.' },
		],
	},
	{
		name: 'exitMarket',
		description: 'Disable a token as collateral in venus lending protocol for a particular pool.',
		required: ['chainName', 'account', 'tokenSymbol', 'pool'],
		props: [
			{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Chain name where to execute the transaction' },
			{ name: 'account', type: 'string', description: 'Account address that will execute the transaction' },
			{ name: 'tokenSymbol', type: 'string', description: 'The token symbol that is involved in the transaction.' },
			{ name: 'pool', type: 'string', enum: supportedPools, description: 'The Pool in which the transaction will be executed.' },
		],
	},
	{
		name: 'getBorrowBalance',
		description: 'Get borrow balance (debt) of a token from Venus protocol.',
		required: ['chainName', 'account', 'tokenSymbol', 'pool'],
		props: [
			{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Chain name where to execute the transaction' },
			{ name: 'account', type: 'string', description: 'Account address that will execute the transaction' },
			{ name: 'tokenSymbol', type: 'string', description: 'The token symbol to query.' },
			{ name: 'pool', type: 'string', enum: supportedPools, description: 'The Pool in which the transaction will be executed.' },
		],
	},
	{
		name: 'getBorrowAPR',
		description: 'Get Current Supply APR for a token in a particular pool.',
		required: ['chainName', 'tokenSymbol', 'pool'],
		props: [
			{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Chain name where to execute the transaction' },
			{ name: 'tokenSymbol', type: 'string', description: 'The token symbol that is involved in the transaction.' },
			{ name: 'pool', type: 'string', enum: supportedPools, description: 'The Pool in which the transaction will be executed.' },
		],
	},
	{
		name: 'getSupplyAPR',
		description: 'Get Current Supply APR for a token in a particular pool.',
		required: ['chainName', 'tokenSymbol', 'pool'],
		props: [
			{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Chain name where to execute the transaction' },
			{ name: 'tokenSymbol', type: 'string', description: 'The token symbol to query.' },
			{ name: 'pool', type: 'string', enum: supportedPools, description: 'The Pool in which the transaction will be executed.' },
		],
	},
	{
		name: 'getAccountLiquidity',
		description: 'Get the borrow Limit and shortfall of a account for a token in particular pool.',
		required: ['chainName', 'account', 'pool'],
		props: [
			{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Chain name where to execute the transaction' },
			{ name: 'account', type: 'string', description: 'Account address that will execute the transaction' },
			{ name: 'pool', type: 'string', enum: supportedPools, description: 'The Pool in which the transaction will be executed.' },
		],
	},
	{
		name: 'getEnabledCollateral',
		description: 'Get all enabled collateral assets and their symbols for an account in Venus protocol.',
		required: ['chainName', 'account', 'pool'],
		props: [
			{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Chain name to query the data from' },
			{ name: 'account', type: 'string', description: 'Account address to check enabled collateral for' },
			{ name: 'pool', type: 'string', enum: supportedPools, description: 'The Pool to check enabled collateral in' },
		],
	},
	{
		name: 'getDescriptionVenus',
		description: 'Get detailed information about Venus Protocol features and how to use them.',
		required: [],
		props: [],
	},
	{
		name: 'getSupportedTokens',
		description: 'Get list of supported tokens for a specific pool on a particular chain.',
		required: ['chainName', 'pool'],
		props: [
			{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Chain name to query the supported tokens from' },
			{ name: 'pool', type: 'string', enum: supportedPools, description: 'The Pool to get supported tokens for' },
		],
	},
	{
		name: 'updateToken',
		description: 'Update the exchange rate, borrow balance (debt) and borrow limit for a specific token in Venus protocol.',
		required: ['chainName', 'account', 'tokenSymbol', 'pool'],
		props: [
			{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Chain name where to execute the transaction' },
			{ name: 'account', type: 'string', description: 'Account address that will execute the transaction' },
			{ name: 'tokenSymbol', type: 'string', description: 'The token symbol to update exchange rate for' },
			{ name: 'pool', type: 'string', enum: supportedPools, description: 'The Pool in which the transaction will be executed.' },
		],
	},

	//XVS tools
	{
		name: 'stakeXVS',
		description: 'Stake XVS token in venus pool.',
		required: ['chainName', 'account', 'amount'],
		props: [
			{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Chain name where to execute the transaction' },
			{ name: 'account', type: 'string', description: 'Account address that will execute the transaction' },
			{ name: 'amount', type: 'string', description: 'Amount of tokens in decimal format' },
		],
	},
	{
		name: 'requestUnstakeXVS',
		description: 'Request unstake XVS token in venus pool.',
		required: ['chainName', 'account', 'amount'],
		props: [
			{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Chain name where to execute the transaction' },
			{ name: 'account', type: 'string', description: 'Account address that will execute the transaction' },
			{ name: 'amount', type: 'string', description: 'Amount of tokens in decimal format' },
		],
	},
	{
		name: 'getStakeInfoXVS',
		description: 'Get staked XVS balance and pending rewards for an account.',
		required: ['chainName', 'account'],
		props: [
			{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Chain name where to execute the transaction' },
			{ name: 'account', type: 'string', description: 'Account address to check stake info for' },
		],
	},
	{
		name: 'claimStakedRewardsXVS',
		description: 'Claims XVS staking rewards from the Venus protocol.',
		required: ['chainName', 'account'],
		props: [
			{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Chain name where to execute the transaction' },
			{ name: 'account', type: 'string', description: 'Account address that will execute the transaction' },
		],
	},
	{
		name: 'claimUnstakeXVS',
		description: 'Claims unstaked XVS tokens after the withdrawal lock period.',
		required: ['chainName', 'account'],
		props: [
			{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Chain name where to execute the transaction' },
			{ name: 'account', type: 'string', description: 'Account address that will execute the transaction' },
		],
	},
	{
		name: 'getAvailableToClaimUnstakeXVS',
		description: 'Get information about available XVS tokens that can be unstaked and claimed.',
		required: ['chainName', 'account'],
		props: [
			{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Chain name where to execute the transaction' },
			{ name: 'account', type: 'string', description: 'Account address to check available claims for' },
		],
	},
	{
		name: 'getDescriptionXVS',
		description: 'Get detailed information about XVS token features and how to use them in Venus protocol.',
		required: [],
		props: [],
	},
];
