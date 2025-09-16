import { AdapterExport, EVM } from '@heyanon/sdk';
import { supportedChains } from './constants';

const { getChainName } = EVM.utils;

export const tools = [
	{
		type: 'function',
		function: {
			name: 'stakeSTR',
			description: 'Stake (supply) USDS tokens in Sky Token Rewards (STR) module to earn SKY rewards',
			strict: true,
			parameters: {
				type: 'object',
				properties: {
					chainName: {
						type: 'string',
						enum: supportedChains.map(getChainName),
						description: 'Chain name where to stake tokens',
					},
					amount: {
						type: 'string',
						description: 'Amount of USDS tokens to stake in decimal format',
					},
				},
				required: ['chainName', 'amount'],
				additionalProperties: false,
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'withdrawSTR',
			description: 'Withdraw staked USDS tokens from Sky Token Rewards (STR) module',
			strict: true,
			parameters: {
				type: 'object',
				properties: {
					chainName: {
						type: 'string',
						enum: supportedChains.map(getChainName),
						description: 'Chain name where to withdraw tokens',
					},
					amount: {
						type: 'string',
						description: 'Amount of USDS tokens to withdraw in decimal format',
					},
				},
				required: ['chainName', 'amount'],
				additionalProperties: false,
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'claimRewardSTR',
			description: 'Claim earned SKY rewards from Sky Token Rewards (STR) module',
			strict: true,
			parameters: {
				type: 'object',
				properties: {
					chainName: {
						type: 'string',
						enum: supportedChains.map(getChainName),
						description: 'Chain name where to claim rewards',
					},
				},
				required: ['chainName'],
				additionalProperties: false,
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'exitSTR',
			description: 'Withdraw all staked USDS tokens and claim all SKY rewards from Sky Token Rewards (STR) module',
			strict: true,
			parameters: {
				type: 'object',
				properties: {
					chainName: {
						type: 'string',
						enum: supportedChains.map(getChainName),
						description: 'Chain name where to exit staking',
					},
				},
				required: ['chainName'],
				additionalProperties: false,
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'depositSSR',
			description: 'Deposit (stake,supply) USDS tokens to Sky Savings Rate (SSR) module to mint sUSDS tokens with auto-compounding rewards',
			strict: true,
			parameters: {
				type: 'object',
				properties: {
					chainName: {
						type: 'string',
						enum: supportedChains.map(getChainName),
						description: 'Chain name where to deposit tokens',
					},
					amount: {
						type: 'string',
						description: 'Amount of USDS tokens to deposit in decimal format',
					},
				},
				required: ['chainName', 'amount'],
				additionalProperties: false,
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'withdrawSSR',
			description: 'Withdraw (burn,withdraw) USDS tokens from Sky Savings Rate (SSR) module by burning sUSDS tokens',
			strict: true,
			parameters: {
				type: 'object',
				properties: {
					chainName: {
						type: 'string',
						enum: supportedChains.map(getChainName),
						description: 'Chain name where to withdraw tokens',
					},
					amount: {
						type: 'string',
						description: 'Amount of USDS tokens to withdraw in decimal format',
					},
				},
				required: ['chainName', 'amount'],
				additionalProperties: false,
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'convertToSharesSSR',
			description: 'Calculate how many sUSDS tokens you will receive for a given amount of USDS',
			strict: true,
			parameters: {
				type: 'object',
				properties: {
					chainName: {
						type: 'string',
						enum: supportedChains.map(getChainName),
						description: 'Chain name',
					},
					amount: {
						type: 'string',
						description: 'Amount of USDS tokens in decimal format',
					},
				},
				required: ['chainName', 'amount'],
				additionalProperties: false,
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'convertToAssetsSSR',
			description: 'Calculate how many USDS tokens you will receive for a given amount of sUSDS',
			strict: true,
			parameters: {
				type: 'object',
				properties: {
					chainName: {
						type: 'string',
						enum: supportedChains.map(getChainName),
						description: 'Chain name',
					},
					amount: {
						type: 'string',
						description: 'Amount of sUSDS tokens in decimal format',
					},
				},
				required: ['chainName', 'amount'],
				additionalProperties: false,
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'maxWithdrawSSR',
			description: 'Get maximum amount of USDS that can be withdrawn.',
			strict: true,
			parameters: {
				type: 'object',
				properties: {
					chainName: {
						type: 'string',
						enum: supportedChains.map(getChainName),
						description: 'Chain name',
					},
				},
				required: ['chainName'],
				additionalProperties: false,
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'redeemSSR',
			description: 'Redeem (burn,withdraw) sUSDS tokens for USDS tokens',
			strict: true,
			parameters: {
				type: 'object',
				properties: {
					chainName: {
						type: 'string',
						enum: supportedChains.map(getChainName),
						description: 'Chain name',
					},
					shares: {
						type: 'string',
						description: 'Amount of sUSDS tokens to redeem in decimal format',
					},
				},
				required: ['chainName', 'shares'],
				additionalProperties: false,
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'maxRedeemSSR',
			description: 'Get maximum amount of sUSDS that can be redeemed.',
			strict: true,
			parameters: {
				type: 'object',
				properties: {
					chainName: {
						type: 'string',
						enum: supportedChains.map(getChainName),
						description: 'Chain name',
					},
				},
				required: ['chainName'],
				additionalProperties: false,
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'getStakedBalanceSTR',
			description: 'Get staked USDS balance in Sky Token Rewards (STR) module.',
			strict: true,
			parameters: {
				type: 'object',
				properties: {
					chainName: {
						type: 'string',
						enum: supportedChains.map(getChainName),
						description: 'Chain name',
					},
				},
				required: ['chainName'],
				additionalProperties: false,
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'getPendingRewardSTR',
			description: 'Get pending SKY rewards in Sky Token Rewards (STR) module.',
			strict: true,
			parameters: {
				type: 'object',
				properties: {
					chainName: {
						type: 'string',
						enum: supportedChains.map(getChainName),
						description: 'Chain name',
					},
				},
				required: ['chainName'],
				additionalProperties: false,
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'rewardPerTokenSTR',
			description: 'Get current reward rate per staked token in Sky Token Rewards (STR) module',
			strict: true,
			parameters: {
				type: 'object',
				properties: {
					chainName: {
						type: 'string',
						enum: supportedChains.map(getChainName),
						description: 'Chain name',
					},
				},
				required: ['chainName'],
				additionalProperties: false,
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'getUserPositionOnSKY',
			description: 'Get complete user position in Sky protocol including STR staking and SSR positions.',
			strict: true,
			parameters: {
				type: 'object',
				properties: {
					chainName: {
						type: 'string',
						enum: supportedChains.map(getChainName),
						description: 'Chain name',
					},
				},
				required: ['chainName'],
				additionalProperties: false,
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'getSkySupportedChains',
			description: 'Get a list of Sky supported networks with their names and Chain IDs',
			strict: true,
			parameters: {
				type: 'object',
				properties: {},
				required: [],
				additionalProperties: false,
			},
		},
	},
] satisfies AdapterExport['tools'];
