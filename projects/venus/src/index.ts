import { AdapterExport } from '@heyanon/sdk';
import * as functions from './functions';
import { tools } from './tools';

export default {
	tools,
	functions,
	description: 'Venus is a decentralized protocol providing ability to supply/borrow/withdraw multiple tokens.',
} satisfies AdapterExport;
