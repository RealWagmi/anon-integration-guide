import { AdapterExport } from '@heyanon/sdk';
import {
  // Liquidity functions
  addLiquidity,
  claimRewards,
  getALPAPR,
  getEarnings,
  getPoolLiquidity,
  getUserLiquidity,
  getUserTokenBalances,
  removeLiquidity,
  
  // Swap functions
  getSwapsLiquidity,
  marketSwap,
  
  // Leverage trading functions
  closePosition,
  getAllOpenPositions,
  getPerpsLiquidity,
  getPosition,
  openPosition
} from './functions/index.js';

export const adapter: AdapterExport = {
  functions: {
    // Liquidity functions
    addLiquidity,
    claimRewards,
    getALPAPR,
    getEarnings,
    getPoolLiquidity,
    getUserLiquidity,
    getUserTokenBalances,
    removeLiquidity,
    
    // Swap functions
    getSwapsLiquidity,
    marketSwap,
    
    // Leverage trading functions
    closePosition,
    getAllOpenPositions,
    getPerpsLiquidity,
    getPosition,
    openPosition
  },
  tools: [],
  description: 'Integration with Amped Finance - A decentralized perpetual exchange and liquidity protocol'
};
