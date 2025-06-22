# Bybit Spot & Future Trading

Integration between HeyAnon.ai and Bybit Spot & Future trading, including perpetual futures and delivery futures.

## Commands shared by Spot and Futures

### Info on markets

- Show all BTC perpetual markets
- Show all BTC spot markets
- Show last price and volume of BTC/USDT
- Show last price and volume of perpetual market BTC/USDT
- Show details on market BTC/USD:BTC-250926
- Show max leverage for BTC/USDT perps

Please note that asking for future markets (e.g. "Show all BTC future markets") will return both perpetual and delivery (a.k.a. expiry) markets.

### Info on balance

- Show my balance
- Show my BTC balance

Plese note that Bybit uses a Unified Trading Account (UTA) approach, so the returned balance is the total available balance regardless of the product type (spot, futures, etc).

### Info on open orders

- Show all my open orders
- Show my BTC open orders
- Show my stop loss orders
- Show details on order 6d264a83-ed27-4a91-bd86-a9b7b68c96b7

### Cancel orders

- Cancel all my orders
- Cancel all of my spot orders
- Cancel all of my perpetual orders
- Cancel all my orders on BTC/USDT
- Cancel order 63460f59-4c17-4c12-8adb-47ec5da1c949
- Cancel the TP order on my BTC/USDT:USDT position

## Spot trading commands

### Spot - Market & limit orders

- Market buy 1 BTC with USDT
- Buy 1 BTC at a limit price of 40,000 USDT
- Sell half of my BTC at a limit price of 150,000 USDT
- Market buy BTC with all my USDT

The LLM will try to classify buy/sell orders as spot orders, and long/short orders as futures orders. If it is not clear from the context, it will ask the user for clarification.

### Spot - Conditional orders

- Market buy 1 BTC when the price goes below 50,000 USDT
- Buy 1 BTC at 45,000 USDT when the price goes below 50,000 USDT
- TO DO: Market buy BTC with 100 USDT, then place an order to sell it for 10% profit
- TO DO: Market buy 1 BTC with USDT then place a 15% stop loss

Please note that on Bybit, conditional orders have the desirable property of not utilizing your balance until triggered. This allows you to simultaneously place both a take profit and a stop loss order to sell all of your balance, similar to an OCO order but without the automatic cancellation:

- Place a conditional order to sell 1 BTC at 100,000 USDT, and 1 BTC at 150,000 USDT

### Spot - Take profit and stop loss (TP/SL)

On Bybit spot markets, you can create a entry order with TP/SL orders attached, similar to an OTOCO order, or simply set a TP or SL condition.

#### Create an entry order with TP/SL attached (OTOCO)

- TO DO: Sell 1 BTC at a limit price 150,000 with a 10% take profit and a 15% stop loss
- TO DO: Market buy BTC with 100 USDT, then place a 10% take profit and a 15% stop loss
- TO DO: Sell all of my BTC for 150,000 USDT with a 10% take profit and a 15% stop loss

Please note that Bybit requires a limit price to be always set for spot OTOCO orders. If your prompt does not specify a limit price, the tool will automatically set the limit price equal to the current market price.

#### Set a TP or SL condition

- TO DO: Set a 10% TP to sell 1 BTC for USDT
- TO DO: Set a 10% SL to sell 1 BTC for USDT
- TO DO: Set a TP @ 200,000 USDT to sell 1 BTC
- TO DO: Set a SL @ 50,000 USDT to sell 1 BTC

Please note that Bybit APIs do not to allow to place simultaneous spot TP/SL orders in isolation, without an entry (that is, it is not possible to send an OCO order via API). You can achieve something similar by sending two conditional orders, see

- Place a conditional order to sell 1 BTC at 100,000 USDT, and 1 BTC at 150,000 USDT

### Spot - Trailing stop orders

- TO DO: Place an order to sell 1 BTC for USDT with a trailing take profit of 10%
- TO DO: Place an order to sell 1 BTC @ 100,000 USDT with a trailing take profit of 10%
- TO DO: Place an order to sell 1 BTC for USDT with a trailing take loss of 10%
- TO DO: Place an order to sell 1 BTC @ 50,000 USDT with a trailing take loss of 10%
- TO DO: Place an order to buy 1 BTC with USDT with a trailing take profit of 10%
- TO DO: Place an order to buy 1 BTC with USDT with a trailing stop loss of 10%

## Futures trading commands

By "futures" we mean both perpetual futures and delivery (aka "expiry") futures.

### Futures - Info on positions

- Show all my positions
- Show my BTC/USDT position
- Show all of my BTC positions
- Show all of my expiry positions

### Futures - Market & limit orders

- Long 1 BTC with USDT
- Long 1 BTC at limit price of 40,000 USDT
- Short 1 BTC at limit price of 150,000 USDT

You can also specify the position size in terms of margin;

- Long BTC with 100 USDT
- 100x long BTC with 100 USDT
- 100x long BTC with 100 USDT isolated margin
- Spend 100 USDT to long BTC

By default, the agent assumes you want to trade on perpetual markets. To use a delivery market instead, ask for it:

- Long 1 BTC with USDT on the June 2025 delivery market
- Long 1 BTC on BTC:USDT-250926

**IMPORTANT:** If you specify a leverage (5x, 10x, etc) or a margin mode (cross, isolated) for your order, the specified leverage and margin mode will be applied to the whole position and account, respectively, and not just to the amount you are adding/removing. This is because on Bybit the leverage is applied at the market level and the margin mode is applied at the whole account level.

### Futures - Leverage and margin

- Show my margin on BTC/USDT
- What is my leverage on BTC/USDT?
- Set 50x leverage on BTC/USDT
- Change margin mode to isolated
- Change margin mode to cross
- Change margin mode to portfolio
- Add 100 USDT margin to my BTC/USDT position
- Remove 200 USDT margin from my BTC/USDT position

Please note that:

- on Bybit, be careful changing the margin mode, as it will be applied to all of your open positions regardless of the market.
- the margin shown by the tools is the same shown in the Bybit UI. For cross positions, that is the initial margin, while for isolated positions it is the actual margin set aside by the user for the position.

### Futures - Conditional orders

- Long 1 BTC when the price crosses 50,000 USDT
- Long 1 BTC at 45,000 USDT when the price crosses 50,000 USDT

### Futures - Take profit & stop loss

On Bybit futures markets, you can either set TP/SL on an existing position (similar to an OCO order), or directly create a new position with TP/SL (similar to an OTOCO order).

#### Set TP/SL on an existing position (OCO)

- Set a 10% TP and a 10% SL on my BTC/USDT position
- Set a TP @ 200,000 USDT on my BTC position
- Set a SL @ 50,000 USDT on my BTC position

Please note that you can also cancel any existing TP/SL order:

- Cancel the TP order on my BTC/USDT position
- Cancel the SL order on my BTC/USDT position

#### Create a new position with TP/SL attached (OTOCO)

- Spend 100 USDT to 10x long BTC/USDT with a 10% take profit and a 15% stop loss
- 10x long 0.005 BTC/USDT with a 10% take profit and a 15% stop loss
- 10x long 0.005 BTC/USDT at a limit price of 50,000 USDT with a 10% take profit and a 15% stop loss
- 20x short 0.005 BTC/USDT with a 50,000 USDT take profit

#### Reduce only

When it is clear from context that the TP and SL orders are attached to a position, they will be issued as **reduce-only** orders, to prevent accidentally increase the position size or open a new position. To force a reduce only order, just ask for it, e.g.

- TO DO: Long 1 BTC when the price crosses 50,000 USDT, _reduce only_

### Futures - Trailing stop orders

- TO DO: Place an order to long 1 BTC with USDT with a 0.5% trailing stop
- TO DO: Place a reduce-only order to long 1 BTC with USDT with a 0.5% trailing stop
- TO DO: Place an order to long 1 BTC with USDT with a 0.5% trailing stop, with activation at 95,000 USDT
- TO DO: Place an order to short 1 BTC with USDT with a 8% trailing stop
- TO DO: Place a reduce-only order to short 1 BTC with USDT with a 8% trailing stop
- TO DO: Place an order to short 1 BTC with USDT with a 8% trailing stop, with activation at 130,000 USDT

<!-- Please note that:

1. The trailing percent must be a number between 0.1% and 10%.
2. The trailing stop order will be triggered as a market order once the price moves by the specified percentage in the desired direction.
3. Contrary to spot, on futures you cannot specify whether the trailing stop order is SL or TP. -->

### Futures - Close positions

- Close my BTC/USDT position
- Close all my positions
- Close all of my BTC positions

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

- The assistant will try to classify buy/sell orders as spot orders, and long/short orders as futures orders. If it is not clear from the context, or the market symbol, it will ask the user for clarification.

- Bybit [no longer supports](https://bybit-exchange.github.io/docs/v5/position/cross-isolate) setting margin mode at the market level, but only at the account level, hence the tools `getUserMarginMode` and `setUserMarginMode` do not have a `market` parameter. The main effect is that if you change the margin mode (e.g. from cross to isolated), the new margin mode will be applied to all of your open positions regardless of the market. The leverage, instead, is still set at the market level, hence the tools `getUserLeverageOnMarket` and `setUserLeverageOnMarket` have a `market` parameter.

- On the contrary, Bybit DOES allow you to change leverage at the market level, just like Binance and most exchanges.

- Bybit supports OCO orders only for SPOT markets, and only at the UI level. There's no explicit support for OCO orders at the API level ([link](https://www.bybit.com/en/help-center/article/One-Cancels-the-Other-OCO-Orders)). However, this is a semantic distinction, as Bybit's TP/SL orders which can be attached to a position or a spot entry order, can be thought as OCO orders. More precisely, when you create a spot limit order with TP/SL attached, or when you create a position with TP/SL attached, you are performing an OTOCO order (one-triggers-a-one-cancels-the-other-order). Instead, when you add a TP/SL order to an existing position, you are performing an OCO order (one-cancels-the-other-order). On the contrary, there currently does not seem to be a way to create a simple OCO order (that is, a simultaneousTP/SL order without an entry order) for spot markets at the API level. In this integration we implement all these different types of orders in the following way:

    - Futures OTOCO order: `createPositionWithTakeProfitAndOrStopLossOrderAttached`
    - Futures OCO order: `attachTakeProfitAndOrStopLossOrderToExistingPosition`
    - Spot OTOCO order: `createSpotEntryOrderWithTakeProfitAndOrStopLossAttached`. Can only be a limit order.
    - Spot OCO order: not implemented directy, as it is not supported by the API, but can be simulated as two separate TP and SL orders via repeated calls to the tool `createConditionalOrder` (which does not utilize your balance until triggered)

- Bybit however supports creating a FUTURES position with a TP/SL order attached, via the TP/SL checkbox ([screenshot](https://d.pr/i/v4jUor)), and this is what we have implemented in the `createPositionWithTakeProfitAndOrStopLossOrderAttached` tool, using the CCXT feature described [here](https://docs.ccxt.com/#/README?id=stoploss-and-takeprofit-orders-attached-to-a-position).

- Bybit allows switching margin mode (at the account level) as long as the trader has sufficient margin and the change itself doesn't trigger immediate liquidation.

- The Bybit API upon order creation only returns the order ID, not the order object ([docs](https://bybit-exchange.github.io/docs/v5/order/create-order)). Hence, after creating an order, we always use the `getOrderById` tool to fetch the order object.

- Trigger direction is needed when placing trigger orders (https://discord.com/channels/690203284119617602/690203284727660739/1367189081418633389)

- Limit orders with TP/SL (regardless of spot or futures) appear as a single order both in the API and in the UI; for futures orders, the "Trade Type" is set to "Open long" or "Open short" ([spot screenshot](https://d.pr/i/n1b05r), [futures screenshot](https://d.pr/i/nWzWRG)). When the main order is filled, the TP/SL orders will still appear as a single separate TP/SL order ([spot screenshot](https://d.pr/i/yJtL3X)); for futures orders it will have the "Trade Type" set to "Close long" or "Close short".

- When adding a TP/SL order to an existing position (or creating a new position with TP/SL attached) the TP/SL will appear in the UI as a single order (see [screenshot](https://d.pr/i/CgH0vF)).

- When listing orders and positions, Bybit requires the `settleCoin` parameter, therefore it is needed to loop through settlement coins. This integration supports USDC and USDT as settlement coins, via the `SUPPORTED_SETTLE_CURRENCIES` constant.

- Orders that are not in the last 500 orders (of any status) are not accessible via the API.

- To fetch information about a specific order, it is not sufficient to know the ID and the market symbol: we also need to specify whether the order is a trigger order or not.

- The `fetchLeverageTiers` method is supported by CCXT, but it takes forever as it goes through 40 pages of markets, so we just infer the max leverage from the market object, without showing the actual tier for that leverage.

- Had to implement the following functions in [exchange.ts](./src/helpers/exchange.ts) to cover the gaps in CCXT:

    - `attachTakeProfitAndOrStopLossOrderToExistingPosition`
    - `getAccountMarginMode`
    - `addOrReducePositionMargin`
    - `getUserOpenOrders`
    - `getOrderById`

- Bybit API keys expire after 3 months unless one adds IP whitelisting

## Reference

- [Bybit V5 API docs](https://bybit-exchange.github.io/docs/v5/intro)
- [Bybit API FAQ](https://www.bybit.com/future-activity/en/developer)
- [Bybit API Place order](https://bybit-exchange.github.io/docs/v5/order/create-order)
- [Bybit API trading-stop endpoint](https://bybit-exchange.github.io/docs/v5/position/trading-stop) to set TP/SL on futures positions
- [Bybit guide to open a testnet account](https://www.bybit.com/en/help-center/article/How-to-Request-Test-Coins-on-Testnet)
- [Bybit Postman collection](https://github.com/bybit-exchange/QuickStartWithPostman)
- [Bybit margin mode FAQ](https://www.bybit.com/en/help-center/article/What-is-Isolated-Margin-Cross-Margin)
- [CCXT leverage tiers](https://docs.ccxt.com/#/README?id=leverage-tiers)
- [CCXT Order structure](https://docs.ccxt.com/#/?id=order-structure)
- [CCXT Querying orders](https://docs.ccxt.com/#/README?id=querying-orders)
- [CCXT Placing orders](https://docs.ccxt.com/#/README?id=placing-orders)
- [CCXT Conditional/trigger orders](https://docs.ccxt.com/#/README?id=conditional-orders)
- [CCXT Bybit CreateOrder](https://docs.ccxt.com/#/exchanges/bybit?id=createorder)
