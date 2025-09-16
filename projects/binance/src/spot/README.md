# Binance Spot Trading

Integration between HeyAnon.ai and Binance Spot trading.

## Common Tasks

1. **Markets**

    - Show last price and volume of BTC/USDT on @binance
    - Show all spot markets for BTC on @binance
    - Show all perpetual and futures markets for BTC on @binance

1. **Info on orders and balances**

    - Show all my open orders on @binance
    - Show my open orders on BTC/USDT on @binance
    - Show details on order 232168017 on @binance
    - Show my spot balance on @binance
    - Show my spot ETH balance on @binance

1. **Transfer funds between accounts**

    - Transfer 5,000 USDT to my futures account on @binance
    - Transfer all my USDT from my futures account to my spot account on @binance
    - Sell 1 BTC for USDT then transfer the obtained USDT to my futures account on @binance

1. **Market & limit orders**

    - Market buy 1 BTC with USDT on @binance
    - Buy 1 BTC at 40,000 USDT on @binance
    - Sell half of my BTC at 150,000 USDT on @binance
    - Buy BTC with all my USDT on @binance

1. **Conditional orders**

    - Market buy 1 BTC on @binance when the price goes below 50,000 USDT
    - Buy 1 BTC at 45,000 USDT on @binance when the price goes below 50,000 USDT
    - Market buy BTC with 100 USDT, then place an order to sell it for 10% profit on @binance
    - Market buy 1 BTC with USDT then place a 15% stop loss on @binance

1. **Take profit & stop loss (OCO)**

    - Sell 1 BTC for USDT with a 10% take profit and a 15% stop loss on @binance
    - Market buy BTC with 100 USDT, then place a 10% take profit and a 15% stop loss on @binance
    - Sell all of my BTC for USDT with a 10% take profit and a 15% stop loss on @binance

1. **Trailing stop orders**

    - Place an order to sell 1 BTC for USDT with a trailing take profit of 10%
    - Place an order to sell 1 BTC @ 100,000 USDT with a trailing take profit of 10%
    - Place an order to sell 1 BTC for USDT with a trailing take loss of 10%
    - Place an order to sell 1 BTC @ 50,000 USDT with a trailing take loss of 10%
    - Place an order to buy 1 BTC with USDT with a trailing take profit of 10%
    - Place an order to buy 1 BTC with USDT with a trailing stop loss of 10%

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