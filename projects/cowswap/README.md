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
   - "How much ETH can I buy for 100 USDC?"

## Available Functions

- cancelOrders
    - "Cancel the order <OrderId>"
    - "Cancel the orders <OrderId> <OrderId> <OrderId>"
- getOrderCompletionStatus
    - "Get the completion status for the order <OrderId>?"
    - "Is the order with <OrderId> finished?"
- getOrders
    - "Get all my orders."
    - "Show me all my orders."
- getQuote
    - "How much ETH can I buy for 100 USDC?"
    - "If I want 0.1 BTC, how much USDT do I need?"
- postLimitBuyOrder
    - "How much ETH can I buy for 100 USDC?"
    - "Buy 500 USDT worth of MATIC when MATIC is $1.20."
- postLimitSellOrder
    - "Sell 1 ETH when ETH reaches $4000."
    - "Sell 0.5 BTC when BTC hits $45,000."
- postSwapOrder
    - "Swap 100 USDC for DAI."
    - "Swap 50 LINK for ETH."

## Installation

```bash
yarn add @heyanon/cowswap
```

