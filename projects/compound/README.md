# compound

Compound III is an EVM compatible protocol that enables supplying of crypto assets as collateral in order to borrow the base asset. Accounts can also earn interest by supplying the base asset to the protocol.

## Supported Networks

-   ETHEREUM
-   ARBITRUM
-   BASE
-   OPTIMISM
-   POLYGON
-   MANTLE
-   SCROLL

## Common Tasks

1. Supplying Base Assets

-   "Supply 100 USDC in @compound on Ethereum"
-   "Supply all USDC in @compound on Ethereum"
-   "Supply 10 USDT in @compound on Ethereum"

2. Withdrawing Base Assets

-   "Withdraw 100 USDC in @compound on Ethereum"
-   "Withdraw all USDC in @compound on Ethereum"
-   "Withdraw 10 USDT in @compound on Ethereum"

3. Supplying Collateral Assets

-   "Supply 0.1 ETH in the USDC market in @compound on Ethereum"
-   "Supply 0.001 WBTC in the USDT market in @compound on Optimism"
-   "Supply 1 wstETH in the AERO market in @compound on Base"

4. Borrowing Base Assets

-   "Borrow 20 USDC in @compound on Ethereum"
-   "Borrow 0.1 USDT in @compound on Ethereum"
-   "Borrow 10 AERO in @compound on Base"

5. Repaying Base Assets

-   "Repay 20 USDC in @compound on Ethereum"
-   "Repay 0.1 USDT in @compound on Ethereum"
-   "Repay all borrowed AERO in @compound on Base"

6. APR and Utilization Data Queries

-   "Get APR for all markets in @compound on Ethereum"
-   "Get APR for the USDC market in @compound on Ethereum"
-   "Get APR for the AERO market in @compound on Base"
-   "Calculate the yearly expected rewards for the USDC market on Optimism"

7. Account Management

-   "Get my supplied amount for all markets in @compound on Ethereum"
-   "Get my borrowed amount for all markets in @compound on Ethereum"
-   "How much did I borrow from the AERO market on Base?"
-   "What collateral did I supply on the Ethereum USDC market?"

## Available Functions

-   getAPRForAllMarkets
-   getAPRForMarket
-   getBorrowedForAllMarkets
-   getBorrowedForMarket
-   getCollateralForMarket
-   getSuppliedForAllMarkets
-   getSuppliedForMarket
-   repay
-   repayAll
-   supplyBase
-   supplyBaseAll
-   supplyCollateral
-   borrow
-   withdrawBase
-   withdrawBaseAll
-   withdrawCollateral

## Installation

```bash
yarn add @heyanon/compound
```
