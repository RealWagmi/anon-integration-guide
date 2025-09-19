import { Chain, EVM } from '@heyanon/sdk';

const { ChainIds } = EVM.constants;

export const supportedChains = [ChainIds[Chain.ETHEREUM], ChainIds[Chain.BASE]];

/**
 * Maximum number of positions to show when calling the portfolio tool
 */
export const MAX_POSITIONS_IN_RESULTS = 50;

/**
 * Maximum number of liquidity pools to show in the search results
 */
export const MAX_LIQUIDITY_POOLS_IN_RESULTS = 10;

/**
 * Minimum $ liquidity for a market to appear in search results
 */
export const MIN_LIQUIDITY_FOR_MARKET = 100000;
