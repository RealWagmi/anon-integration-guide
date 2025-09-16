import { AdapterExport, AdapterTag } from '@heyanon/sdk';
import * as functions from './functions';
import { tools } from './tools';

export default {
	tools,
	functions,
	description:
		'Binance Spot is a centralized exchange interface for placing and managing spot orders. It supports market and limit orders, conditional entries (triggers, take-profit/stop-loss, trailing stops), canceling orders, and transferring funds between accounts. It can also provide information about balances, open orders, specific orders, market details, and active markets for a currency.',
	tags: [AdapterTag.CEX, AdapterTag.LIMIT_ORDER],
	chains: [],
	executableFunctions: [
		'cancelAllOrdersOnMarket',
		'cancelOrderByIdAndMarket',
		'createSimpleOrder',
		'createTakeProfitStopLossOrder',
		'createTrailingStopOrder',
		'createTriggerOrder',
		'transferFunds',
	],
} satisfies AdapterExport;
