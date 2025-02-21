import { AdapterExport } from '@heyanon/sdk';
import * as functions from './functions';
import { tools } from './tools';

export default {
	tools,
	functions,
	description: 'Hypersonic optimizes DEX trading on EVM chains using advanced routing & real-time market data to deliver best execution across multiple liquidity sources.',
} satisfies AdapterExport;
