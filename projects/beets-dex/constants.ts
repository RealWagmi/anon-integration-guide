import { ChainId } from '@heyanon/sdk';

export const supportedChains = [ChainId.SONIC];

/**
 * Maximum number of pools to fetch from the backend in
 * a single request.
 */
export const MAX_FETCH_POOLS = 100;