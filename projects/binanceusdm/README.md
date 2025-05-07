# Binance USDM Futures Trading

Integration between HeyAnon.ai and Binance USDM Futures trading.

## Common Tasks

1. **Markets**

- Show all future markets for BTC on @binanceusdm
- Show last price and volume of BTC/USDT:USDT on @binanceusdm
- Show max leverage for BTC/USDT:USDT on @binanceusdm

1. **Info on orders and balances**

 <!-- - Show all my open orders on @binanceusdm
 - Show my open orders on BTC/USDT on @binanceusdm
 - Show details on order 232168017 on @binanceusdm
 - Show my spot balance on @binanceusdm
 - Show my spot ETH balance on @binanceusdm -->

1. **Transfer funds between accounts**

 <!-- - Transfer 5,000 USDT to my futures account on @binanceusdm
 - Transfer all my USDT from my futures account to my spot account on @binanceusdm
 - Sell 1 BTC for USDT then transfer the obtained USDT to my futures account on @binanceusdm -->

1. **Market & limit orders**

 <!-- - Market buy 1 BTC with USDT on @binanceusdm
 - Buy 1 BTC at 40,000 USDT on @binanceusdm
 - Sell half of my BTC at 150,000 USDT on @binanceusdm (_TODO: Might incur LOT_MARKET_LOT_SIZE error_)
 - Ape all my USDT into BTC on @binanceusdm (_TODO: Might incur LOT_MARKET_LOT_SIZE error_) -->

1. **Conditional orders**

 <!-- - Market buy 1 BTC on @binanceusdm when the price goes below 50,000 USDT
 - Buy 1 BTC at 45,000 USDT on @binanceusdm when the price goes below 50,000 USDT
 - Market buy BTC with 100 USDT, then place an order to sell it for 10% profit on @binanceusdm
 - Market buy 1 BTC with USDT then place a 15% stop loss on @binanceusdm -->

1. **Take profit & stop loss (OCO)**

 <!-- - Sell 1 BTC for USDT with a 10% take profit and a 15% stop loss on @binanceusdm
 - Market buy BTC with 100 USDT, then place a 10% take profit and a 15% stop loss on @binanceusdm
 - Sell all of my BTC for USDT with a 10% take profit and a 15% stop loss on @binanceusdm -->

1. **Trailing stop orders**

 <!-- - Place an order to sell 1 BTC for USDT with a trailing take profit of 10%
 - Place an order to sell 1 BTC @ 100,000 USDT with a trailing take profit of 10%
 - Place an order to sell 1 BTC for USDT with a trailing take loss of 10%
 - Place an order to sell 1 BTC @ 50,000 USDT with a trailing take loss of 10%
 - Place an order to buy 1 BTC with USDT with a trailing take profit of 10%
 - Place an order to buy 1 BTC with USDT with a trailing stop loss of 10% -->

1. **Cancel orders**

 <!-- - Cancel all my orders on @binanceusdm
 - Cancel all my orders on BTC/USDT on @binanceusdm
 - Cancel my BTC orders on @binanceusdm
 - Cancel order 232168017 on @binanceusdm -->

## CCXT

We use the [CCXT](https://github.com/ccxt/ccxt/) library to interact with the various Binance Futures APIs. Some of Binance's features are not supported by CCXT; for these cases, we implemented some helper functions to cover the gaps, that you can find in the [binance.ts](./src/helpers/binance.ts) file.

## Test with the askBinance agent

I've built a simple agent called `askBinance` to test the integration. To run it, you need to configure .env:

```bash
cd projects/binanceusdm
pnpm install
cp .env.example .env
# insert OpenAI key into .env
# insert Binance Futures API credentials into .env
# optionally insert Binance Futures API testnet credentials into .env
# you can take testnet credentials from https://testnet.binancefuture.com
```

and then you can ask questions directly:

```bash
pnpm ask-binance "Show me the price of BTC/USDT:USDT"
```

To show all the requests and responses to the LLM, run `askBinance` with `--debug-llm` flag:

```bash
pnpm ask-binance "Show me the price of BTC/USDT:USDT" --debug-llm
```

## Binance specific behaviors

- Binance does not support `fetchPosition` for future and perpetual markets, see workaround in `getUserOpenPositionBySymbol`
- In Binance it seems the settle currency is always the same as the quote currency. When implementing other exchanges, if this is not the case, we should consider reviewing the `completeMarketSymbol` function.

## Reference

- [Binance fAPI docs](https://developers.binance.com/docs/derivatives/usds-margined-futures/general-info)
- [Binance fAPI orders](https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api)
- [CCXT leverage tiers](https://docs.ccxt.com/#/README?id=leverage-tiers)
- [CCXT Order structure](https://docs.ccxt.com/#/?id=order-structure)
- [CCXT Querying orders](https://docs.ccxt.com/#/README?id=querying-orders)
- [CCXT Placing orders](https://docs.ccxt.com/#/README?id=placing-orders)
- [CCXT Conditional/trigger orders](https://docs.ccxt.com/#/README?id=conditional-orders)
- [CCXT Binance createOrder](https://docs.ccxt.com/#/exchanges/binance?id=createorder)
- [Isolated margin order](https://discord.com/channels/690203284119617602/690203284727660739/1119234330775007262)
