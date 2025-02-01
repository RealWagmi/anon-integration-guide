import { AdapterExport } from '@heyanon/sdk';
import {
  // Liquidity functions
  getALPAPR,
  getEarnings,
  claimRewards,
  addLiquidity,
  removeLiquidity,
  getUserLiquidity,
  getPoolLiquidity,
  
  // Swap functions
  getSwapLiquidity,
  marketSwap,
  limitSwap,
  
  // Leverage trading functions
  getPerpsLiquidity,
  openPosition,
  getPosition,
  getAllOpenPositions,
  closePosition
} from './functions/index.js';

export const adapter: AdapterExport = {
  functions: {
    // Liquidity functions
    getALPAPR,
    getEarnings,
    claimRewards,
    addLiquidity,
    removeLiquidity,
    getUserLiquidity,
    getPoolLiquidity,
    
    // Swap functions
    getSwapLiquidity,
    marketSwap,
    limitSwap,
    
    // Leverage trading functions
    getPerpsLiquidity,
    openPosition,
    getPosition,
    getAllOpenPositions,
    closePosition
  },
  tools: [],
  description: 'Integration with Amped Finance - A decentralized perpetual exchange and liquidity protocol'
};
