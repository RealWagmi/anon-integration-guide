// functions/index.ts
/**
 * Core trading and liquidity management functions for SynFutures integration
 * 
 * This module exports all the functions needed to interact with the SynFutures protocol:
 * - Market and limit orders for trading
 * - Opening leveraged positions
 * - Liquidity provision and management
 * - Fee collection for liquidity providers
 */

// Trading functions
export { marketOrder } from './marketOrder';
export { limitOrder } from './limitOrder';
export { openPosition } from './openPosition';

// Liquidity management functions
export { provideLiquidity } from './provideLiquidity';
export { removeLiquidity } from './removeLiquidity';
export { adjustRange } from './adjustRange';
export { claimFees } from './claimFees';

// Types
export type { Props as MarketOrderProps } from './marketOrder';
export type { Props as LimitOrderProps } from './limitOrder';
export type { Props as OpenPositionProps } from './openPosition';
export type { Props as ProvideLiquidityProps } from './provideLiquidity';
export type { Props as RemoveLiquidityProps } from './removeLiquidity';
export type { Props as AdjustRangeProps } from './adjustRange';
export type { Props as ClaimFeesProps } from './claimFees'; 