# Bybit Spot & Future Trading

Integration between HeyAnon.ai and Bybit Spot & Future trading, including perpetual futures and delivery futures.

## Common Tasks

### Markets

- Show all BTC perpetual markets on @bybit
- Show all BTC spot markets on @bybit
- Show last price and volume of BTC/USDT on @bybit
- Show last price and volume of perpetual market BTC/USDT on @bybit
- Show details on market BTC/USD:BTC-250926 on @bybit
- Show max leverage for BTC/USDT perps on @bybit

Please note that asking for future markets (e.g. "Show all BTC future markets") will return both perpetual and delivery markets.

### Info on balance

- Show my balance on @bybit
- Show my BTC balance on @bybit

Plese note that Bybit uses a Unified Trading Account (UTA) approach, so the returned balance is the total available balance regardless of the product type (spot, futures, etc).

### Info on positions

- Show all my positions on @bybit
- Show my BTC/USDT position on @bybit
- Show all of my BTC positions on @bybit
- Show all of my expiry positions on @bybit

### Info on open orders

<!-- - Show all my open orders on @bybit -->
<!-- - Show my BTC open orders on @bybit -->
<!-- - Show details on order 232168017 on @bybit -->

### Transfer funds between accounts

<!-- - Transfer 5,000 USDT to my futures account on @bybit -->
<!-- - Transfer all my USDT from my futures account to my spot account on @bybit -->

### Market & limit orders

<!-- - Long 1 BTC with USDT on @bybit -->
<!-- - Long 1 BTC with USDT with isolated margin on @bybit -->
<!-- - 100x long 1 BTC with USDT on @bybit -->
<!-- - Long 1 BTC at limit price of 40,000 USDT on @bybit -->
<!-- - Short BTC with limit price of 150,000 USDT on @bybit -->

<!-- By default, the agent assumes you want to trade on perpetual markets. To use a delivery market instead, ask for it: -->

<!-- - Long 1 BTC with USDT on the June 2025 delivery market -->
<!-- - Long 1 BTC on USDT:USDT-250926 -->

<!-- **IMPORTANT:** If you specify a leverage (5x, 10x, etc) or a margin mode (cross, isolated) for your order, the specified leverage and margin mode will be applied to the whole position, and not just to the amount you are adding/removing. This is because on Binance the leverage and margin mode are applied at the market level, and not at the order level. For more details, see the [Leverage and margin mode](#changing-leverage-and-margin-mode) section. -->

### Leverage and margin

<!-- - Show my margin on BTC/USDT on @bybit -->
<!-- - What is my leverage on BTC/USDT on @bybit? -->
<!-- - Set 50x leverage on BTC/USDT on @bybit -->
<!-- - Set isolated margin mode on BTC/USDT on @bybit -->
<!-- - Set cross margin mode on BTC/USDT on @bybit -->
<!-- - Add 100 USDT margin to my BTC/USDT position on @bybit -->
<!-- - Remove 200 USDT margin from my BTC/USDT position on @bybit -->

<!-- Please note that the margin shown by the tools is the same shown in the Binance UI. For cross positions, that is the initial margin, while for isolated positions it is the actual margin set aside by the user for the position. -->

<!-- **IMPORTANT**: If you change leverage and margin mode of a pair, your existing position in that pair will be affected. See the [Leverage and margin mode](#changing-leverage-and-margin-mode) section for more details. -->

### Conditional orders

<!-- - Long 1 BTC on @bybit when the price crosses 50,000 USDT -->
<!-- - Long 1 BTC at 45,000 USDT on @bybit when the price crosses 50,000 USDT -->

### Stop Loss & Take Profit

<!-- - Add a 10% TP and a 15% SL to my existing BTC/USDT position -->
<!-- - 20x long 1 BTC with USDT, then place a stop loss at 15% and three take profit targets at 10%-20%-30% -->
<!-- - Short 1 BTC with USDT, then place an order to close the position at 10% profit on @bybit -->
<!-- - Long 1 BTC with USDT, then place a 10% take profit and 15% stop loss on @bybit -->

<!-- When it is clear from context that the TP and SL orders are attached to a position, they will be issued as **reduce-only** orders, to prevent accidentally increase the position size or open a new position. To force a reduce only order, just ask for it, e.g. -->

<!-- - Long 1 BTC on @bybit when the price crosses 50,000 USDT, _reduce only_ -->

### Trailing stop orders

- Place an order to long 1 BTC with USDT with a 0.5% trailing stop
      <!-- - Place a reduce-only order to long 1 BTC with USDT with a 0.5% trailing stop -->
      <!-- - Place an order to long 1 BTC with USDT with a 0.5% trailing stop, with activation at 95,000 USDT -->
      <!-- - Place an order to short 1 BTC with USDT with a 8% trailing stop -->
      <!-- - Place a reduce-only order to short 1 BTC with USDT with a 8% trailing stop -->
      <!-- - Place an order to short 1 BTC with USDT with a 8% trailing stop, with activation at 130,000 USDT -->

<!-- Please note that:

1. The trailing percent must be a number between 0.1% and 10%.
2. The trailing stop order will be triggered as a market order once the price moves by the specified percentage in the desired direction.
3. Contrary to spot, on futures you cannot specify whether the trailing stop order is SL or TP. -->

### Close positions

<!-- - Close my BTC/USDT position on @bybit -->
<!-- - Close all my positions on @bybit -->
<!-- - Close all of my BTC positions on @bybit -->

### Cancel orders

<!-- - Cancel all my orders on @bybit -->
<!-- - Cancel all my orders on BTC/USDT on @bybit -->
<!-- - Cancel order 232168017 on @bybit -->

## Changing leverage and margin mode

<!-- When you create a position without specifying the leverage or the margin mode, the position will be created with whatever is the current configuration for the market.

Changing a market's leverage will affect your existing position in that market. Regardless of whether the position is isolated or cross margin, the act of increasing the leverage will have the following effects:

- will free up margin
- will NOT affect the liquidation price of existing positions, unless you use the freed margin to open new positions or withdraw from the futures account
- will NOT affect your present or future profits on the existing position, because the position size is not affected

Decreasing the market's leverage, instead, will have the following effects:

- will increase the margin needed to keep the position open
- if the margin needed is greater than the margin available, you won't be able to decrease the leverage
- IS NOT ALLOWED if you have an isolated position on the market, because Binance requires you to manually add margin to isolated positions
- will NOT change the liquidation price of existing positions, because liquidation price in cross-margin positions (the only ones for which you can decrease the leverage) only depends on position size and total margin in the account
- will NOT affect your present or future profits on the existing position, because the position size is not affected

Things are simpler when it comes to **changing the margin mode**: Binance does not allow you to change the margin mode of a market if you have an open position in that market. -->

## CCXT

We use the [CCXT](https://github.com/ccxt/ccxt/) library to interact with the Bybit unified V5 API. Some of Bybit's features are not supported by CCXT; for these cases, we implemented some helper functions to cover the gaps, that you can find in the [exchange.ts](./src/helpers/exchange.ts) file.

## Test with the ask-bybit agent

I've built a simple agent called `ask-bybit` to test the integration. To run it, you need to configure .env:

```bash
cd projects/bybit
pnpm install
cp .env.example .env
# insert OpenAI key into .env
# insert Bybit API credentials into .env
# optionally insert Bybit API testnet credentials into .env
# you can take testnet credentials from https://testnet.bybit.com
```

and then you can ask questions directly:

```bash
pnpm ask-bybit "Show me the price of BTC/USDT:USDT"
```

To show all the requests and responses to the LLM, run the agent with the `--debug-llm` flag:

```bash
pnpm ask-bybit "Show me the price of BTC/USDT:USDT" --debug-llm
```

## Bybit specific behaviors

- This integration embraces the Bybit Unified Trading Account approach in its latest version ([UTA 2.0 Pro](https://bybit-exchange.github.io/docs/v5/acct-mode)). This has several implications:

    - the integration works seamlessly across both spot and perpetual markets
    - the `exchange` object must have the `enableUnifiedAccount` option set to `true` ([Discord](https://discord.com/channels/690203284119617602/690203284727660739/1267775046366007339))
    - the `getBalance` tool will return a total balance, across all account types (spot, futures, etc)
    - there is no need to move funds from spot to futures and viceversa (this is why there's no `transferFunds` tool)
    - the only transfer needed is from the funding wallet to the trading wallet, which we assume is done by the user
    - the LLM has to do some inference to determine the market type from the market symbol, see `MARKET_DESCRIPTION`
    - many tools require the `marketType` parameter to be explicitly provided, e.g. `getCurrencyMarketsOfGivenType`

- Bybit [no longer supports](https://bybit-exchange.github.io/docs/v5/position/cross-isolate) setting margin mode at the market level, but only at the account level. The main effect is that if you change the margin mode (e.g. from cross to isolated), the new margin mode will be applied to all of your open positions regardless of the market. Please note that leverage is still set at the market level.

- Bybit allows switching margin mode (at the account level) as long as the trader has sufficient margin and the change itself doesn't trigger immediate liquidation.

- Trigger direction is needed when placing trigger orders (https://discord.com/channels/690203284119617602/690203284727660739/1367189081418633389)

- Bybit API keys expire after 3 months unless one adds IP whitelisting

<!-- - Binance Futures trailing stop orders always execute as market orders when triggered, that is, you cannot set a limit price for the order. This is different from spot where you can specify a limit price for trailing stop orders. This is accounted for via the constant `SUPPORTS_LIMIT_PRICE_FOR_TRAILING_STOP_ORDERS`. -->
<!-- - Binance fAPI does not support OTOCO orders, that is, the creation in one go of position + TP + SL. Therefore, we send 3 separate orders ([link](https://dev.binance.vision/t/how-to-implement-otoco-tp-sl-orders-using-api/1622/14)). -->
<!-- - CCXT does not support `fetchPosition` for Binance future and perpetual markets, see workaround in `getUserOpenPositionBySymbol` -->
<!-- - Binance fAPI does not support `closePosition`, see workaround in `closePositionBySendingOppositeMarketOrder` -->
<!-- - In Binance it seems the settle currency is always the same as the quote currency. When implementing other exchanges, if this is not the case, we should consider reviewing the `completeMarketSymbol` function. -->

## Reference

- [Bybit V5 API docs](https://bybit-exchange.github.io/docs/v5/intro)
- [Bybit API FAQ](https://www.bybit.com/future-activity/en/developer)
- [Bybit guide to open a testnet account](https://www.bybit.com/en/help-center/article/How-to-Request-Test-Coins-on-Testnet)
- [Bybit Postman collection](https://github.com/bybit-exchange/QuickStartWithPostman)
- [Bybit margin mode FAQ](https://www.bybit.com/en/help-center/article/What-is-Isolated-Margin-Cross-Margin)
- [CCXT leverage tiers](https://docs.ccxt.com/#/README?id=leverage-tiers)
- [CCXT Order structure](https://docs.ccxt.com/#/?id=order-structure)
- [CCXT Querying orders](https://docs.ccxt.com/#/README?id=querying-orders)
- [CCXT Placing orders](https://docs.ccxt.com/#/README?id=placing-orders)
- [CCXT Conditional/trigger orders](https://docs.ccxt.com/#/README?id=conditional-orders)
- [CCXT Bybit CreateOrder](https://docs.ccxt.com/#/exchanges/bybit?id=createorder)
