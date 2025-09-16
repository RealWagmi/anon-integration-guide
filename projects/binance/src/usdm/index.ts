import { AdapterExport, AdapterTag } from '@heyanon/sdk';
import * as functions from './functions';
import { tools } from './tools';

export default {
	tools,
	functions,
	description:
		'Binance USDM is a centralized futures interface for placing and managing USDⓈ-M perpetual orders and positions. It supports market and limit orders, conditional entries (triggers and trailing stops), closing positions, adjusting leverage and margin mode, adding or reducing isolated margin, canceling orders, and transferring funds between accounts. It can also provide information about balances, positions, open orders, specific orders, market details, active markets for a currency, and your leverage/margin settings.',
	tags: [AdapterTag.CEX, AdapterTag.LIMIT_ORDER],
	chains: [],
	executableFunctions: [
		'addMarginToIsolatedPosition',
		'cancelAllOrdersOnMarket',
		'cancelOrderByIdAndMarket',
		'closePositions',
		'createSimpleOrder',
		'createTrailingStopOrder',
		'createTriggerOrder',
		'reduceMarginFromIsolatedPosition',
		'setLeverage',
		'setMarginMode',
		'transferFunds',
	],
} satisfies AdapterExport;
