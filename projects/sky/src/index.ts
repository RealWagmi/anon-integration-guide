import { AdapterExport } from '@heyanon/sdk';
import * as functions from './functions';
import { tools } from './tools';

export default {
	tools,
	functions,
	description:
		'Sky (old: Maker DAO) is a decentralized protocol providing two core functions: 1) STR (Sky Token Rewards) module - supply/withdraw USDS to earn SKY governance tokens, 2) SSR (Sky Savings Rate) module - supply/withdraw USDS to mint/burn auto-compounding sUSDS tokens.',
} satisfies AdapterExport;
