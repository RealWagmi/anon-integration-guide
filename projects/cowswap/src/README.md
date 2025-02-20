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
   - "Swap 10 USDC for ETH on BASE"
   - "Cancel the order with orderUid of <OrderId>."

2. Information Queries
   - "Get all my cowswap orders on ETHEREUM"
   - "What's the status of the orderUid <OrderId>?"
   - "How much ETH can I buy for 100 USDC?"

## Available Functions

- cancelOrders
    - "Cancel the order <OrderId>"
    - "Cancel the orders <OrderId> <OrderId> <OrderId>"
- getOrderCompletionStatus
    - "Get the completion status for the order <OrderId>?"
    - "Is the order with <OrderId> finished?"
- getOrders
    - "Get all my orders on ethereum"
    - "Show me all my orders on arbitrum."
- getQuote
    - "How much ETH can I buy for 100 USDC on ETHEREUM?"
    - "If I want 0.1 WBTC, how much USDT do I need on ETHEREUM?"
- postLimitBuyOrder
    - "How much ETH can I buy for 100 USDC on ETHEREUM?"
    - "Buy 500 USDT worth of ARB when ARB is $1.20 on ARBITRUM?"
- postLimitSellOrder
    - "Sell 1 ETH when ETH reaches $4000 on BASE."
    - "Sell 0.5 WBTC when WBTC hits $45,000 on BASE."
- postSwapOrder
    - "Swap 100 USDC for DAI on BASE."
    - "Swap 50 USDC for ETH on BASE."

## Installation

```bash
yarn add @heyanon/cowswap
```

