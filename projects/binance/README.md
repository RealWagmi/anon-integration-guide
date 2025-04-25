# Binance Spot and Futures Trading

Integration between HeyAnon.ai and Binance Spot and Futures trading.

## Common Tasks

1. **Markets**

    - Show all AAVE markets on @binance
    - Price of AAVE/USDT on @binance
    - Market buy 1 AAVE on AAVE/USDT on @binance

2. **Orders info**

    - Show my open orders on @binance
    - Show all my open orders on BTC/USDT on @binance
    - Show details on order 232168017 on @binance

3. **Cancel orders**

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
