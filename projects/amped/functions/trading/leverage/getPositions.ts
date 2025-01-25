import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants.js';
import { Vault } from '../../../abis/Vault.js';

export interface Position {
  size: string;
  collateral: string;
  averagePrice: string;
  entryFundingRate: string;
  hasProfit: boolean;
  realizedPnl: string;
  lastUpdated: Date | null;
}

export async function getPosition(
  provider: ethers.providers.Provider,
  account: string,
  indexToken: string = CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
  collateralToken: string = CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN,
  isLong: boolean = true
): Promise<Position> {
  const vault = new ethers.Contract(
    CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
    Vault,
    provider
  );

  try {
    const position = await vault.getPosition(account, collateralToken, indexToken, isLong);
    
    // Handle timestamp - if it's a BigNumber or number, convert it
    let timestamp = null;
    if (position[6]) {
      const timestampValue = typeof position[6] === 'object' && 'toNumber' in position[6] 
        ? position[6].toNumber() 
        : Number(position[6]);
      timestamp = new Date(timestampValue * 1000);
    }
    
    return {
      size: ethers.utils.formatUnits(position[0], 30),
      collateral: ethers.utils.formatEther(position[1]),
      averagePrice: ethers.utils.formatUnits(position[2], 30),
      entryFundingRate: position[3].toString(),
      hasProfit: Boolean(position[4]),
      realizedPnl: ethers.utils.formatUnits(position[5], 30),
      lastUpdated: timestamp
    };
  } catch (error) {
    console.error('Error getting position:', error);
    throw error;
  }
}

export async function printPosition(
  provider: ethers.providers.Provider,
  account: string,
  indexToken?: string,
  collateralToken?: string,
  isLong?: boolean
): Promise<void> {
  try {
    const position = await getPosition(provider, account, indexToken, collateralToken, isLong);
    console.log('\nPosition Details:');
    console.log('Size:', position.size);
    console.log('Collateral:', position.collateral);
    console.log('Average Price:', position.averagePrice);
    console.log('Entry Funding Rate:', position.entryFundingRate);
    console.log('Has Profit:', position.hasProfit);
    console.log('Realized PnL:', position.realizedPnl);
    if (position.lastUpdated) {
      console.log('Last Updated:', position.lastUpdated.toISOString());
    }

    if (position.size === '0.0') {
      console.log('\nNo active position found. The position request may have been cancelled.');
    }
  } catch (error) {
    console.error('Error printing position:', error);
  }
} 