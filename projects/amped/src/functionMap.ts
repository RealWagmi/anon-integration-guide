/**
 * Maps function names to their implementations
 */

import { addLiquidity } from './functions/liquidity/addLiquidity.js';
import { removeLiquidity } from './functions/liquidity/removeLiquidity.js';
import { getPerpsLiquidity } from './functions/trading/leverage/getPerpsLiquidity.js';
import { getPosition } from './functions/trading/leverage/getPosition.js';
import { getALPAPR } from './functions/liquidity/getALPAPR.js';
import { getUserTokenBalances } from './functions/liquidity/getUserTokenBalances.js';
import { getUserLiquidity } from './functions/liquidity/getUserLiquidity.js';
import { getPoolLiquidity } from './functions/liquidity/getPoolLiquidity.js';
import { claimRewards } from './functions/liquidity/claimRewards.js';
import { getSwapsLiquidity } from './functions/trading/swaps/getSwapsLiquidity.js';
import { marketSwap } from './functions/trading/swaps/marketSwap.js';
import { getAllOpenPositions } from './functions/trading/leverage/getAllOpenPositions.js';
import { openPosition } from './functions/trading/leverage/openPosition.js';
import { closePosition } from './functions/trading/leverage/closePosition.js';
import { getEarnings } from './functions/liquidity/getEarnings.js';

export const functionMap = {
    addLiquidity,
    removeLiquidity,
    getPerpsLiquidity,
    getPosition,
    getALPAPR,
    getUserTokenBalances,
    getUserLiquidity,
    getPoolLiquidity,
    claimRewards,
    getSwapsLiquidity,
    marketSwap,
    getAllOpenPositions,
    openPosition,
    closePosition,
    getEarnings,
};