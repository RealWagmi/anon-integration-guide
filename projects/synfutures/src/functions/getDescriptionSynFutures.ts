import { FunctionReturn } from '../types';

export async function getDescriptionSynFutures(): Promise<FunctionReturn> {
    return {
        success: true,
        data: `SynFutures is a decentralized derivatives trading protocol that allows you to:

1. Trade Futures Contracts:
   - Open long or short positions with leverage
   - Trade any asset against any other asset
   - Use market orders for immediate execution
   - Place limit orders at specific price levels

2. Provide Liquidity:
   - Add liquidity to trading pairs to earn fees
   - Choose your price range for concentrated liquidity
   - Adjust your liquidity position as market moves
   - Claim earned trading fees

3. Key Features:
   - Permissionless listings (trade "anything against anything")
   - Single-token concentrated liquidity for better capital efficiency
   - Unified liquidity system combining AMM and orderbook
   - Advanced price stabilization mechanisms
   - Cross-margin trading for better capital utilization

4. Risk Management:
   - Dynamic funding rates to balance market
   - Liquidation mechanisms to protect the system
   - Price oracle integration for reliable mark prices
   - Adjustable leverage up to 25x

5. Getting Started:
   - Connect your wallet
   - Choose a trading pair
   - Select market or limit order
   - Set your position size and leverage
   - Monitor and manage your positions`
    };
} 