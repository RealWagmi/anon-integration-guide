# Binance Spot and Futures Trading

Integration between HeyAnon.ai and Binance Spot and Futures trading.

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
    - Sell half of my BTC at 150,000 USDT on @binance (_TODO: Might incur LOT_MARKET_LOT_SIZE error_)
    - Ape all my USDT into BTC on @binance (_TODO: Might incur LOT_MARKET_LOT_SIZE error_)

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

## CCXT

We use the [CCXT](https://github.com/ccxt/ccxt/) library to interact with the various Binance APIs. Some of Binance's features are not supported by CCXT; for these cases, we implemented some helper functions to cover the gaps, that you can find in the [binance.ts](./src/helpers/binance.ts) file.

## Test with the askBinance agent

I've built a simple agent called `askBinance` to test the integration. To run it, you need to configure .env:

```bash
cd projects/binance
pnpm install
cp .env.example .env
# insert OpenAI key into .env
# insert Binance API credentials into .env
# optionally insert Binance API testnet credentials into .env
# you can take testnet credentials from https://testnet.binance.vision/
```

and then you can ask questions directly:

```bash
pnpm ask-binance "Show me the price of BTC/USDT"
```

To show all the requests and responses to the LLM, run `askBinance` with `--debug-llm` flag:

```bash
pnpm ask-binance "Show me the price of BTC/USDT" --debug-llm
```

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
