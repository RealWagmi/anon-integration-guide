import { Connection, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { CUSTODY_ACCOUNTS, AssetType } from '../types';
import { deserializeCustody, DecodedCustody } from '../layouts';

export interface RateData {
    utilization: number;
    annualRate: number;
    hourlyRate: number;
    timestamp: number;
}

export class AccountMonitor {
    private connection: Connection;
    private subscriptions: Map<string, number>;
    private rateCallbacks: Set<(asset: AssetType, rates: RateData) => void>;
    private lastProcessedSlot: Map<string, number>;
    private isRunning: boolean;

    constructor(rpcUrl: string = 'https://api.mainnet-beta.solana.com') {
        this.connection = new Connection(rpcUrl, 'confirmed');
        this.subscriptions = new Map();
        this.rateCallbacks = new Set();
        this.lastProcessedSlot = new Map();
        this.isRunning = false;
    }

    async start() {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;

        for (const [asset, address] of Object.entries(CUSTODY_ACCOUNTS)) {
            try {
                const pubkey = new PublicKey(address);
                
                // Subscribe to account changes
                const subId = this.connection.onAccountChange(
                    pubkey,
                    (account, context) => {
                        // Avoid processing duplicate updates
                        const lastSlot = this.lastProcessedSlot.get(asset) || 0;
                        if (context.slot > lastSlot) {
                            this.handleAccountUpdate(asset as AssetType, account.data);
                            this.lastProcessedSlot.set(asset, context.slot);
                        }
                    },
                    'confirmed'
                );
                this.subscriptions.set(asset, subId);

                // Get initial data
                const account = await this.connection.getAccountInfo(pubkey);
                if (account) {
                    this.handleAccountUpdate(asset as AssetType, account.data);
                }
            } catch (error) {
                console.error(`Error setting up monitor for ${asset}:`, error);
            }
        }
    }

    stop() {
        this.isRunning = false;
        for (const [asset, subId] of this.subscriptions.entries()) {
            try {
                this.connection.removeAccountChangeListener(subId);
            } catch (error) {
                console.error(`Error removing listener for ${asset}:`, error);
            }
        }
        this.subscriptions.clear();
        this.lastProcessedSlot.clear();
    }

    onRateUpdate(callback: (asset: AssetType, rates: RateData) => void) {
        this.rateCallbacks.add(callback);
        return () => {
            this.rateCallbacks.delete(callback);
        };
    }

    private handleAccountUpdate(asset: AssetType, data: Buffer) {
        try {
            const custody = deserializeCustody(data);
            const rates = this.calculateRates(custody);
            
            // Notify subscribers
            for (const callback of this.rateCallbacks) {
                callback(asset, rates);
            }
        } catch (error) {
            console.error(`Error processing ${asset} update:`, error);
        }
    }

    private calculateRates(custody: DecodedCustody): RateData {
        const { assets, jumpRateState } = custody;
        
        // Calculate utilization
        const utilization = assets.owned > 0 ? assets.locked / assets.owned : 0;

        // Calculate dual slope borrow rate
        const lowerSlope = (jumpRateState.targetRateBps - jumpRateState.minRateBps) 
            / jumpRateState.targetUtilizationRate;
        const upperSlope = (jumpRateState.maxRateBps - jumpRateState.targetRateBps) 
            / (1 - jumpRateState.targetUtilizationRate);

        let annualRate;
        if (utilization < jumpRateState.targetUtilizationRate) {
            annualRate = jumpRateState.minRateBps + (lowerSlope * utilization);
        } else {
            annualRate = jumpRateState.targetRateBps + 
                (upperSlope * (utilization - jumpRateState.targetUtilizationRate));
        }

        const hourlyRate = annualRate / 8760;

        return {
            utilization: utilization * 100,  // Convert to percentage
            annualRate: annualRate / 100,    // Convert BPS to percentage
            hourlyRate: hourlyRate / 100,    // Convert BPS to percentage
            timestamp: Date.now()
        };
    }

    async getCurrentRates(asset: AssetType): Promise<RateData | null> {
        try {
            const address = CUSTODY_ACCOUNTS[asset];
            if (!address) {
                return null;
            }

            const account = await this.connection.getAccountInfo(new PublicKey(address));
            if (!account) {
                return null;
            }

            const custody = deserializeCustody(account.data);
            return this.calculateRates(custody);
        } catch (error) {
            console.error(`Error getting current rates for ${asset}:`, error);
            return null;
        }
    }
}

export const accountMonitor = new AccountMonitor();
export default accountMonitor;