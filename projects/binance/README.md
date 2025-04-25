# Binance Spot and Futures Trading

Integration between HeyAnon.ai and Binance Spot and Futures trading.

## Common Tasks

1. **Markets**

    - Show all AAVE markets on @binance
    - Price of AAVE/USDT on @binance
    - Market buy 1 AAVE on AAVE/USDT on @binance

1. **Order and balance info**

    - Show my open orders on @binance
    - Show all my open orders on BTC/USDT on @binance
    - Show details on order 232168017 on @binance
    - Show my balance on @binance
    - Show my ETH balance on @binance

1. **Place orders**

    - Market buy 1 BTC on BTC/USDT on @binance
    - Buy 1 BTC at 40000 USDT on @binance
    - Buy 1 BTC at 40000 USDT with a 5% stop loss on @binance
    - Sell 1 BTC at 40000 USDT with a 10% take profit on @binance
    - When the price goes below 50000 USDT, trigger a market buy order for 1 BTC on @binance
    - When the prices goes below 50000 USDT, trigger a limit buy order for 1 BTC at 40000 USDT on @binance

1. **Cancel orders**

    - Cancel all my orders on @binance
    - Cancel all my orders on BTC/USDT on @binance
    - Cancel my BTC orders on @binance
    - Cancel order 232168017 on @binance

## Reference

- [Order structure](https://docs.ccxt.com/#/?id=order-structure)
- [Querying orders](https://docs.ccxt.com/#/README?id=querying-orders)
- [Placing orders](https://docs.ccxt.com/#/README?id=placing-orders)
- [Conditional/trigger orders](https://docs.ccxt.com/#/README?id=conditional-orders)
- [Binance createOrder](https://docs.ccxt.com/#/exchanges/binance?id=createorder)

## Binance specific behaviors

- `fetchOrder` and `cancelOrder` require both `id` and `symbol`
- `cancelAllOrders` requires a `symbol`
