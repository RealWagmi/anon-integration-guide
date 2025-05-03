# Binance Spot and Futures Trading

Integration between HeyAnon.ai and Binance Spot and Futures trading.

## Common Tasks

1. **Markets**

    - Show all AAVE markets on @binance
    - Price of AAVE/USDT on @binance
    - Market buy 1 AAVE on AAVE/USDT on @binance

1. **Info on orders and balances**

    - Show my open orders on @binance
    - Show all my open orders on BTC/USDT on @binance
    - Show details on order 232168017 on @binance
    - Show my balance on @binance
    - Show my ETH balance on @binance

1. **Market & limit orders**

    - Market buy 1 BTC with USDT on @binance
    - Buy 1 BTC at 40000 USDT on @binance
    - Sell half of my BTC at 40000 USDT on @binance
    - Ape all my USDT into BTC on @binance

1. **Conditional orders**

    - Market buy 1 BTC on @binance when the price goes below 50000 USDT
    - Buy 1 BTC at 45000 USDT on @binance when the price goes below 50000 USDT
    - Sell 100 USDT for BTC for 10% profit on @binance
    - Market buy 1 BTC with USDT then place a 15% stop loss on @binance

1. **Take profit & stop loss (OCO)**

    - Sell 1 BTC for USDT with a 10% take profit and a 15% stop loss on @binance
    - Sell all of my BTC for USDT with a 10% take profit and a 15% stop loss on @binance
    - Buy BTC with 1000 USDT, then place a 10% take profit and a 15% stop loss on @binance

1. **Trailing stop orders**

    - `Sell 1 BTC for USDT with a trailing take profit of 10%`: You are willing to sell 1 BTC for a minimum profit of 10% with respect to the current price. If the price goes up even more, you will sell when the price retraces by 10%.
    - `Sell 1 BTC @ 100.000 USDT with a trailing take profit of 10%`: Same as the above, but your order will be executed at a limit price of 100.000 USDT.
    - `Sell 1 BTC for USDT with a trailing take loss of 10%`: You are willing to sell 1 BTC for a maximum loss of 10% with respect to the current price. If the price goes up instead of down, you will only sell when the price retraces again by 10%.
    - `Sell 1 BTC @ 50.000 USDT with a trailing take loss of 10%`: Same as the above, but your order will be executed at a limit price of 50.000 USDT.
    - `Buy 1 BTC with USDT with a trailing take profit of 10%`: You are willing to buy 1 BTC but only if the current price goes down by at least 10%. If the price decreases even more, you will buy on when the price increases again by 10%.
    - `Buy 1 BTC with USDT with a trailing stop loss of 10%`: You are willing to buy 1 BTC at a maximum price of 10% above the current price. If the price goes lower instead of higher, you will buy when the price increases again by 10%.

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
- [Isolated margin order](https://discord.com/channels/690203284119617602/690203284727660739/1119234330775007262)

## Binance specific behaviors

- OCO order not supported on CCXT > implemented helper function `createBinanceOcoOrder`
- `fetchOrder` and `cancelOrder` require both `id` and `symbol`
- `cancelAllOrders` requires a `symbol`
- Binance APIs [lack a trigger price parameter](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/trading-endpoints#new-order-trade), so specifying `triggerPrice` automatically creates a `STOP_LOSS` order ([see Discord](https://discord.com/channels/690203284119617602/690203284727660739/1367189081418633389))
- CCXT does not seem to support OCO oders for spot ([Discord](https://discord.com/channels/690203284119617602/690203284727660739/1237329333824000030))
