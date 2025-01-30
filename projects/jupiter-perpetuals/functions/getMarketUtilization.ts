import { FunctionReturn, toResult } from '@heyanon/sdk';
import { Connection, PublicKey } from '@solana/web3.js';
import { CUSTODY_ACCOUNTS, AssetType } from '../types';
import { deserializeCustodyAccount } from '../services/accountMonitor';

interface Props {
    asset: AssetType;
}

/**
 * Gets current utilization rates for a Jupiter Perpetuals market
 * @param props - The asset to get utilization for
 * @returns Current utilization data
 */
export async function getMarketUtilization({ asset }: Props): Promise<FunctionReturn> {
    try {
        if (!CUSTODY_ACCOUNTS[asset]) {
            return toResult(`Invalid asset: ${asset}. Must be one of: ${Object.keys(CUSTODY_ACCOUNTS).join(', ')}`, true);
        }

        const connection = new Connection(process.env.SOLANA_RPC_URL!);
        const accountInfo = await connection.getAccountInfo(new PublicKey(CUSTODY_ACCOUNTS[asset]));
        
        if (!accountInfo) {
            return toResult(`Failed to fetch account info for ${asset}`, true);
        }

        const custody = deserializeCustodyAccount(accountInfo.data);
        
        const utilization = {
            asset,
            totalTokens: custody.assets.owned,
            lockedTokens: custody.assets.locked,
            utilization: custody.assets.owned > 0 
                ? (custody.assets.locked / custody.assets.owned) * 100 
                : 0,
            globalShortSize: custody.assets.globalShortSizes,
            timestamp: Date.now()
        };

        return toResult(JSON.stringify(utilization));
    } catch (error) {
        return toResult(`Error fetching market utilization: ${error.message}`, true);
    }
}