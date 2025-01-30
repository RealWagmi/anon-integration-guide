import { Connection, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { CUSTODY_ACCOUNTS, AssetType } from '../types';
import { deserializeCustody, DecodedCustody } from '../layouts';
import { Logger, ConsoleLogger } from './logger';

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
    private logger: Logger;

    private validateRpcUrl(url: string): string {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            throw new Error('Endpoint URL must start with `http:` or `https:`');
        }
        return url;
    }

    constructor(
        rpcUrl: string = 'https://api.mainnet-beta.solana.com',
        logger: Logger = new ConsoleLogger()
    ) {
        this.connection = new Connection(this.validateRpcUrl(rpcUrl), 'confirmed');
        this.subscriptions = new Map();
        this.rateCallbacks = new Set();
        this.lastProcessedSlot = new Map();
        this.isRunning = false;
        this.logger = logger;
    }

    async start() {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        this.logger.info('Starting account monitor...');

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
                    this.logger.info(`Initial data fetched for ${asset}`);
                }
            } catch (error) {
                this.logger.error(`Error setting up monitor for ${asset}:`, error);
            }
        }
    }

    async stop() {
        if (!this.isRunning) {
            return;
        }
        
        this.isRunning = false;
        this.logger.info('Stopping account monitor...');
        
        // Clear all subscriptions first
        for (const [asset, subId] of this.subscriptions.entries()) {
            try {
                if (subId) {
                    await this.connection.removeAccountChangeListener(subId);
                    this.logger.debug(`Removed listener for ${asset}`);
                }
            } catch (error) {
                this.logger.error(`Error removing listener for ${asset}:`, error);
            }
        }
        
        this.subscriptions.clear();
        this.lastProcessedSlot.clear();
        this.rateCallbacks.clear();
    }

    onRateUpdate(callback: (asset: AssetType, rates: RateData) => void) {
        this.rateCallbacks.add(callback);
        this.logger.debug('Added new rate update callback');
        return () => {
            this.rateCallbacks.delete(callback);
            this.logger.debug('Removed rate update callback');
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
            this.logger.debug(`Processed update for ${asset}`, { rates });
        } catch (error) {
            this.logger.error(`Error processing ${asset} update:`, error);
        }
    }

    private calculateRates(custody: DecodedCustody): RateData {
        const { assets, jumpRateState } = custody;
        
        // Calculate utilization percentage
        const SCALING_FACTOR = BigInt(1e18);
        
        const owned = assets.owned;
        const locked = assets.locked;
        const utilization = owned > BigInt(0) 
            ? Number((locked * BigInt(100) * SCALING_FACTOR) / owned) / Number(SCALING_FACTOR)
            : 0;
    
        // Convert rate values from their scaled form (and from BPS to percentage)
        const targetUtil = Number(jumpRateState.targetUtilizationRate) / Number(SCALING_FACTOR) * 100;
        const minRate = Number(jumpRateState.minRateBps) / Number(SCALING_FACTOR);
        const maxRate = Number(jumpRateState.maxRateBps) / Number(SCALING_FACTOR);
        const targetRate = Number(jumpRateState.targetRateBps) / Number(SCALING_FACTOR);
    
        // Calculate annual rate
        let annualRate;
        if (maxRate === 0 || targetRate === 0) {
            // Handle special case where max/target rates are 0
            annualRate = minRate;
        } else if (utilization <= targetUtil) {
            // Below target: interpolate between min and target rate
            const utilRatio = utilization / targetUtil;
            annualRate = minRate + (targetRate - minRate) * utilRatio;
        } else {
            // Above target: interpolate between target and max rate
            const excessUtil = Math.min((utilization - targetUtil) / (100 - targetUtil), 1);
            annualRate = targetRate + (maxRate - targetRate) * excessUtil * 0.5;
        }
    
        // Calculate hourly rate
        const hourlyRate = annualRate / 8760; // hours in a year
    
        if (process.env.DEBUG) {
            console.log('Calculated values:', {
                utilization: utilization.toFixed(2),
                targetUtil: targetUtil.toFixed(2),
                minRate: minRate.toFixed(4),
                maxRate: maxRate.toFixed(4),
                targetRate: targetRate.toFixed(4),
                annualRate: annualRate.toFixed(4),
                hourlyRate: hourlyRate.toFixed(6)
            });
        }
    
        return {
            utilization,
            annualRate,
            hourlyRate,
            timestamp: Date.now()
        };
    }

    async getCurrentRates(asset: AssetType): Promise<RateData | null> {
        try {
            const address = CUSTODY_ACCOUNTS[asset];
            if (!address) {
                this.logger.warn(`Invalid asset: ${asset}`);
                return null;
            }

            const account = await this.connection.getAccountInfo(new PublicKey(address));
            if (!account) {
                this.logger.warn(`No account found for ${asset}`);
                return null;
            }

            const custody = deserializeCustody(account.data);
            return this.calculateRates(custody);
        } catch (error) {
            this.logger.error(`Error getting current rates for ${asset}:`, error);
            return null;
        }
    }
}

export const accountMonitor = new AccountMonitor();
export default accountMonitor;
