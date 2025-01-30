import { Connection, PublicKey } from '@solana/web3.js';
import { FunctionReturn, toResult } from '@heyanon/sdk';
import { CUSTODY_ACCOUNTS, AssetType } from '../types';
import { deserializeCustody } from '../layouts';

interface Props {
    asset: AssetType;
}

/**
 * Calculates borrow rates for Jupiter Perpetuals markets using a dual-slope model:
 * - Below target utilization: Linear interpolation between min and target rates
 * - Above target utilization: Linear interpolation between target and max rates with 0.5x multiplier
 * 
 * Rate calculation:
 * 1. Below target: rate = minRate + (targetRate - minRate) * (utilization / targetUtilization)
 * 2. Above target: rate = targetRate + (maxRate - targetRate) * (utilization - targetUtil)/(1 - targetUtil) * 0.5
 * 
 * @param {Props} props - Asset to get rates for 
 * @returns {Promise<FunctionReturn>} Object containing:
 *   - utilization: Current market utilization (%)
 *   - annualRate: Annual borrow rate (%)
 *   - hourlyRate: Hourly borrow rate (%)
 *   - timestamp: Current timestamp
 */
export async function getBorrowRates({ asset }: Props): Promise<FunctionReturn> {
    try {
        if (!CUSTODY_ACCOUNTS[asset]) {
            return toResult(`Invalid asset: ${asset}. Must be one of: ${Object.keys(CUSTODY_ACCOUNTS).join(', ')}`, true);
        }

        const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
        const accountInfo = await connection.getAccountInfo(new PublicKey(CUSTODY_ACCOUNTS[asset]));
        
        if (!accountInfo) {
            return toResult(`Failed to fetch account info for ${asset}`, true);
        }

        const custody = deserializeCustody(accountInfo.data);
        
        // Convert bigints to numbers with proper scaling
        const owned = Number(custody.assets.owned) / 1e9; // Convert to decimal considering token decimals
        const locked = Number(custody.assets.locked) / 1e9;
        
        // Calculate utilization as decimal (0-1)
        const utilization = owned > 0 ? locked / owned : 0;

        // Convert BPS values from bigint to decimals (0-1)
        const targetUtil = Number(custody.jumpRateState.targetUtilizationRate) / 10000;
        const minRate = Number(custody.jumpRateState.minRateBps) / 10000;
        const maxRate = Number(custody.jumpRateState.maxRateBps) / 10000;
        const targetRate = Number(custody.jumpRateState.targetRateBps) / 10000;

        let annualRate;
        if (utilization <= targetUtil) {
            // Below target
            annualRate = minRate + ((targetRate - minRate) * (utilization / targetUtil));
        } else {
            // Above target
            const excessUtil = (utilization - targetUtil) / (1 - targetUtil);
            annualRate = targetRate + ((maxRate - targetRate) * excessUtil * 0.5);
        }

        const rates = {
            asset,
            utilization: utilization * 100,    // to percentage
            annualRate: annualRate * 100,      // to percentage
            hourlyRate: (annualRate * 100) / 8760,
            timestamp: Date.now()
        };

        return toResult(JSON.stringify(rates));
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return toResult(`Error fetching borrow rates: ${errorMessage}`, true);
    }
}
