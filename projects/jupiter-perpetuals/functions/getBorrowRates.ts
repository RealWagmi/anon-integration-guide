import { Connection, PublicKey } from '@solana/web3.js';
import type { FunctionReturn } from '@heyanon/sdk';
import { CUSTODY_ACCOUNTS, AssetType } from '../types';
import { deserializeCustody } from '../layouts';

interface Props {
    asset: AssetType;
}

export async function getBorrowRates({ asset }: Props): Promise<FunctionReturn> {
    try {
        if (!CUSTODY_ACCOUNTS[asset]) {
            return {
                success: false,
                data: `Invalid asset: ${asset}. Must be one of: ${Object.keys(CUSTODY_ACCOUNTS).join(', ')}`
            };
        }

        const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
        const accountInfo = await connection.getAccountInfo(new PublicKey(CUSTODY_ACCOUNTS[asset]));
        
        if (!accountInfo) {
            return {
                success: false,
                data: `Failed to fetch account info for ${asset}`
            };
        }

        const custody = deserializeCustody(accountInfo.data);
        
        // Calculate utilization
        const utilization = custody.assets.owned > 0 
            ? custody.assets.locked / custody.assets.owned 
            : 0;

        // Calculate dual slope borrow rate
        const lowerSlope = (custody.jumpRateState.targetRateBps - custody.jumpRateState.minRateBps) 
            / custody.jumpRateState.targetUtilizationRate;
        const upperSlope = (custody.jumpRateState.maxRateBps - custody.jumpRateState.targetRateBps) 
            / (1 - custody.jumpRateState.targetUtilizationRate);

        let annualRateBps;
        if (utilization < custody.jumpRateState.targetUtilizationRate) {
            // Below target: minRate + slope * utilization
            annualRateBps = custody.jumpRateState.minRateBps + (lowerSlope * (utilization * 10000));
        } else {
            // Above target: targetRate + slope * (utilization - targetUtilization)
            annualRateBps = custody.jumpRateState.targetRateBps + 
                (upperSlope * ((utilization * 10000) - custody.jumpRateState.targetUtilizationRate));
        }

        const hourlyRateBps = annualRateBps / 8760;

        const rates = {
            asset,
            utilization: utilization * 100,       // Convert to percentage
            annualRate: annualRateBps / 100,      // Convert BPS to percentage
            hourlyRate: hourlyRateBps / 100,      // Convert BPS to percentage
            timestamp: Date.now()
        };

        return {
            success: true,
            data: JSON.stringify(rates)
        };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
            success: false,
            data: `Error fetching borrow rates: ${errorMessage}`
        };
    }
}