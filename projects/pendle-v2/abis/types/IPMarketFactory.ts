export interface IPMarketFactory {
    isValidMarket(market: string): Promise<boolean>;
} 