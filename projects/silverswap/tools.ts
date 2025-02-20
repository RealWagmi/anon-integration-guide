import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'getHighestFlare',
        description: 'Retrieves the current highest bid on Flare. This allows you to identify the highest bid so you can outbid it.',
        required: ['chainName'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to get the highest bid on Flare',
            },
        ],
    },
	{
        name: 'getHighestSnatch',
        description: 'Retrieves the current highest bid on Snatch for a specific pool. This allows you to identify the highest bid for the pool so you can outbid it.',
        required: ['chainName', 'poolToSteal'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to get the highest bid on Snatch (for a specific pool)',
            },
			{
                name: 'poolToSteal',
				type: 'string',
				description: 'The pool address to get the highest bid on Snatch',
            },
        ],
    },
	{
		name: 'bidFlare',
		description: 'Bid with Flare to an whitelisted token, Flare is an auction that results in the buyback of a chosen token (from the whitelisted tokens), using 42.5% of the swap fees accumulated over a 12-hour period.',
		required: ['chainName', 'account', 'amountToBurn', 'buybackToken'],
		props: [
			{
				name: 'chainName',
				type: 'string',
				enum: supportedChains.map(getChainName),
				description: 'Chain name where to bid on Flare',
			},
			{
                name: 'account',
                type: 'string',
                description: 'Account address that will bid on Flare',
            },
			{
				name: 'amountToBurn',
				type: 'string',
				description: 'The amount to bid on Flare in decimal format',
			},
			{
				name: 'buybackToken',
				type: 'string',
				description: 'The buyback token address to bid on Flare',
			},
		],
	},
	{
		name: 'bidSnatch',
		description: 'Bid with Snatch to an SilverSwap pool, Snatch is an auction that results in stealing 42.5% of the swap fees accumulated on a specific pool since the last Snatch (with a minimum period of 12 hours).',
		required: ['chainName', 'account', 'amountToBurn', 'poolToSteal'],
		props: [
			{
				name: 'chainName',
				type: 'string',
				enum: supportedChains.map(getChainName),
				description: 'Chain name where to bid on Snatch',
			},
			{
				name: 'account',
				type: 'string',
				description: 'Account address that will bid on Snatch',
			},
			{
				name: 'amountToBurn',
				type: 'string',
				description: 'The amount to bid on Snatch in decimal format',
			},
			{
				name: 'poolToSteal',
				type: 'string',
				description: 'The pool address to bid on Snatch',
			},
		],
	},
];
