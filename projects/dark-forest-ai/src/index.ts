import { AdapterExport } from '@heyanon/sdk';
import { tools } from './tools';
import { makeAsk } from './functions/makeAsk';
import { fillAsk } from './functions/fillAsk';
import { cancelOpenAsk } from './functions/cancelOpenAsk';
import { getAllOpenAsks } from './functions/getAllOpenAsks';

export default {
	tools,
	functions: {
		makeAsk,
		fillAsk,
		cancelOpenAsk,
		getAllOpenAsks,
	},
	description: 'OTC market for Autonomous Agents on Sonic Blaze Testnet.',
} satisfies AdapterExport;
