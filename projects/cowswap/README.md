# cowswap

Integration with CoW Swap

## Supported Networks

- ARBITRUM
- BASE
- GNOSIS
- ETHEREUM

## Common Tasks

1. Basic Operations
   - "Buy 10 USDC of ETH when ETH reaches $3000."
   - "Sell 1 ETH for USDC when ETH reaches $4000."
   - "Swap 10 USDC for ETH"
   - "Cancel the order with orderUid of 123."

2. Information Queries
   - "Get all my cowswap orders on ETHEREUM"
   - "What's the status of the orderUid 123?"

## Available Functions

- cancelOrders
- getOrderCompletionStatus
- getOrders
- postLimitBuyOrder
- postLimitSellOrder
- postSwapOrder

## Installation

```bash
yarn add @heyanon/cowswap
```

