import { Chain, EVM } from '@heyanon/sdk';

const { ChainIds } = EVM.constants;

export const supportedChains = [ChainIds[Chain.ETHEREUM], ChainIds[Chain.BASE]];

/**
 * Maximum number of positions to show when calling the portfolio tool
 */
export const MAX_POSITIONS_IN_RESULTS = 20;
