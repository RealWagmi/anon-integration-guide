# Bybit Spot & Future Trading

Integration between HeyAnon.ai and Bybit Spot & Future trading, including perpetual futures and delivery futures.

## Commands shared by Spot and Futures

### Info on markets

- Show all BTC perpetual markets
- Show all BTC spot markets
- Show last price and volume of BTC/USDT
- Show last price and volume of perpetual market BTC/USDT
- Show details on market BTC/USDT:USDT-250627
- Show max leverage for BTC/USDT perps

Please note that asking for future markets (e.g. "Show all BTC future markets") will return both perpetual and delivery (a.k.a. expiry) markets.

### Info on balance

- Show my trading account balance
- Show my funding account balance
- Show my BTC balance on the trading account
- Show my total balance
- Show my total BTC balance

Plese note that Bybit uses a Unified Trading Account (UTA) approach, so the returned balance for the trading Account is the total available balance regardless of the product type (spot, futures, etc).

### Transfer funds between accounts

- Transfer 100 USDT from my funding account to the trading account
- Transfer half of my USDT from the trading account to the funding account

### Show deposit address

- Show my deposit address for BTC
- Show my USDT deposit address on Ethereum
- Show my AVAX deposit address on AvaxC chain
- Show my HMSTR deposit address

Please note that if the deposit chain is not specified, the tool will:

- if there is only one available deposit chain, use it (e.g. HMSTR on TON)
- failing that, try to infer it from the currency name (e.g. if currency is BTC, the chain is BTC)
- failing that, ask the user to specify the chain

Furthermore, if the deposit chain requires a tag / memo / paymentId (like XRP and Monero), the tool will return it.

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
- Spend 500 USDT to buy BTC
- Buy 1 BTC at a limit price of 40,000 USDT
- Sell half of my BTC at a limit price of 200,000 USDT
- Market buy BTC with all my USDT

The LLM will try to classify buy/sell orders as spot orders, and long/short orders as futures orders. If it is not clear from the context, it will ask the user for clarification.

### Spot - Conditional orders

- Market buy 1 BTC when the price goes below 50,000 USDT
- Buy 1 BTC at 45,000 USDT when the price goes below 50,000 USDT

Please note that on Bybit, conditional orders have the desirable property of not utilizing your balance until triggered. This allows you to simultaneously place both a take profit and a stop loss order to sell all of your balance, similar to an OCO order but without the automatic cancellation:

- Place a conditional order to sell 1 BTC at 100,000 USDT, and 1 BTC at 200,000 USDT

### Spot - Take profit and stop loss (TP/SL)

On Bybit spot markets, you can create a entry order with TP/SL orders attached, similar to an OTOCO order, or simply set a TP or SL condition.

#### Create an entry order with TP/SL attached (OTOCO)

- Sell 1 BTC/USDT at a limit price 200,000 with a 10% take profit and a 15% stop loss
- Sell all of my BTC at 200,000 USDT with a 10% take profit and a 15% stop loss
- Market buy BTC with 100 USDT, then place a 10% take profit and a 15% stop loss

Please note that Bybit requires a limit price to be always set for spot OTOCO orders. If your prompt does not specify a limit price, the tool will automatically set the limit price slightly below/above the current market price to ensure the order is executed.

#### Set a TP and/or SL condition

- Set a 10% TP and a 15% SL to sell 1 BTC/USDT
- Set a 10% TP and a 15% SL to buy 1 BTC/USDT
- Set a 10% TP to sell 1 BTC/USDT
- Set a SL triggering at 200,000 USDT to sell 1 BTC at a limit price of 250,000 USDT

Please note that Bybit APIs do not to allow to place simultaneous spot TP/SL orders in isolation, without an entry (that is, it is not possible to send an OCO order via API). Under the hood, commands like "Set a 10% TP and a 15% SL to sell 0.5 BTC for USDT" will be translated into two conditional orders, which do not utilize the user balance until triggered.

### Spot - Trailing stop orders

Bybit does not support trailing stop orders for spot markets at the API level. Trying to create a trailing stop order will result in a message explaining that it is not supported.

## Futures trading commands

By "futures" we mean both perpetual futures and delivery (aka "expiry") futures.

### Futures - Info on positions

- Show all my positions
- Show my BTC/USDT position
- Show all of my BTC positions
- Show all of my expiry positions

### Futures - Market & limit orders

- Long 1 BTC with USDT
- 50x long 1 BTC with USDT
- Long 1 BTC at limit price of 40,000 USDT
- Short 1 BTC at limit price of 200,000 USDT

You can also specify the position size in terms of margin;

- Long BTC with 100 USDT
- 100x long BTC with 100 USDT
- 100x long BTC with 100 USDT using isolated margin
- Spend 100 USDT to long BTC

By default, the agent assumes you want to trade on perpetual markets. To use a delivery market instead, ask for it:

- Long 1 BTC with USDT on the June 2025 delivery market
- Long 1 BTC on BTC/USDT:USDT-250627

**IMPORTANT:** If you specify a leverage (5x, 10x, etc) for your order, the specified leverage will be applied to the whole position, and not just to the amount you are adding/removing. This is because on Bybit the leverage is applied at the market level. The margin, instead, is applied at the account level, so be careful when specifying a different margin mode than the current one, because the change will be applied to all of your open positions.

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
- 100x short BTC with 100 USDT when the price crosses 200,000 USDT

### Futures - Take profit & stop loss

On Bybit futures markets, you can either create a new position with TP/SL attached to it (similar to an OTOCO order), or set TP/SL on an existing position (similar to an OCO order).

#### Create a new position with TP/SL attached (OTOCO)

- Spend 100 USDT to 10x long BTC/USDT with a 10% take profit and a 15% stop loss
- 10x long 0.005 BTC/USDT with a 10% take profit and a 15% stop loss
- 10x long 0.005 BTC/USDT at a limit price of 50,000 USDT with a 10% take profit and a 15% stop loss
- 20x short 0.005 BTC/USDT with a 50,000 USDT take profit

#### Set TP/SL on an existing position (OCO)

- Set a 10% TP and a 10% SL on my BTC/USDT position
- Set a TP @ 200,000 USDT on my BTC position
- Set a SL @ 50,000 USDT on my BTC position

Please note that you can also cancel any existing TP/SL order:

- Cancel the TP order on my BTC/USDT position
- Cancel the SL order on my BTC/USDT position
- Cancel all of my TP/SL orders on my BTC/USDT position

### Futures - Trailing stop orders

- Set a 10,000 USDT trailing stop on my BTC/USDT position
- Set a 5% trailing stop on my BTC/USDT position
- Create a 10x BTC/USDT short with 100 USDT and set a 5% trailing stop
- Cancel the trailing stop on my BTC/USDT position
- When BTC price crosses 200,000 USDT, set a 10,000 USDT trailing stop on my BTC/USDT position

Please note that:

1. The trailing stop order will close the position at market price once the price moves by the specified distance in the desired direction.
2. Activation price should be in the direction favorable to the position (higher if long, lower if short)
3. In Bybit, there's no notion whether a trailing spot order is a take profit or a stop loss order.
4. Bybit API does not support to specify trailing stop by percentage: it requires an absolute price distance. The tool will automatically convert any given percentage to an absolute price. This is done at order creation time and won't be updated as the price changes.

### Futures - Close positions

- Close my BTC/USDT perp
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

- **UTA 2.0 Pro:** This integration embraces the Bybit Unified Trading Account approach in its latest version ([UTA 2.0 Pro](https://bybit-exchange.github.io/docs/v5/acct-mode)). This has several implications:

    - the integration works seamlessly across both spot and perpetual markets
    - the `exchange` object must have the `enableUnifiedAccount` option set to `true` ([Discord](https://discord.com/channels/690203284119617602/690203284727660739/1267775046366007339))
    - the `getBalance` tool will return a total balance, across all account types (spot, futures, etc)
    - there is no need to move funds from spot to futures and viceversa (this is why there's no `transferFunds` tool)
    - the only transfer needed is from the funding wallet to the trading wallet, which can be done with the `transferFundsTo` tool
    - the LLM has to do some inference to determine the market type from the market symbol, see `MARKET_DESCRIPTION`
    - many tools require the `marketType` parameter to be explicitly provided, e.g. `getCurrencyMarketsOfGivenType`

- **Market type inference:** The assistant will try to classify buy/sell orders as spot orders, and long/short orders as futures orders. If it is not clear from the context, or the market symbol, it will ask the user for clarification.

- **LLM cognitive load:** In general, the LLM will suffer more cognitive load to distinguish between spot and futures orders. To reduce the token cost and risk of hallucinations, with respect to the Binance integration, we have moved the margin calculation & take profit/stop loss inferences to the tools implementation level, relieving the LLM of this burden (see parameters `amountCurrency`, `takeProfitType`, `stopLossType`).

- **Margin mode:** Bybit [no longer supports](https://bybit-exchange.github.io/docs/v5/position/cross-isolate) setting margin mode at the market level, but only at the account level, hence the tools `getUserMarginMode` and `setUserMarginMode` do not have a `market` parameter. The main effect is that if you change the margin mode (e.g. from cross to isolated), the new margin mode will be applied to all of your open positions regardless of the market. The leverage, instead, is still set at the market level, hence the tools `getUserLeverageOnMarket` and `setUserLeverageOnMarket` have a `market` parameter.

- **Leverage:** On the contrary, Bybit DOES allow you to change leverage at the market level, just like Binance and most exchanges.

- **OCO orders:** Bybit supports OCO orders only for SPOT markets, and only at the UI level. There's no explicit support for OCO orders at the API level ([link](https://www.bybit.com/en/help-center/article/One-Cancels-the-Other-OCO-Orders)). However, this is a semantic distinction, as Bybit's TP/SL orders which can be attached to a position or a spot entry order, can be thought as OCO orders. More precisely, when you create a spot limit order with TP/SL attached, or when you create a position with TP/SL attached, you are performing an OTOCO order (one-triggers-a-one-cancels-the-other-order). Instead, when you add a TP/SL order to an existing position, you are performing an OCO order (one-cancels-the-other-order). On the contrary, there currently does not seem to be a way to create a simple OCO order (that is, a simultaneousTP/SL order without an entry order) for spot markets at the API level. In this integration we implement all these different types of orders in the following way:

    - Futures OTOCO order: `createPositionWithTakeProfitAndOrStopLossOrderAttached`
    - Futures OCO order: `attachTakeProfitAndOrStopLossOrderToExistingPosition`
    - Spot OTOCO order: `createSpotEntryOrderWithTakeProfitAndOrStopLossAttached`. Can only be a limit order.
    - Spot OCO order: not implemented directy, as it is not supported by the API, but can be simulated as two separate TP and SL orders via repeated calls to the tool `createConditionalOrder` (which does not utilize your balance until triggered)

- **Futures TP/SL:** Bybit however supports creating a FUTURES position with a TP/SL order attached, via the TP/SL checkbox ([screenshot](https://d.pr/i/v4jUor)), and this is what we have implemented in the `createPositionWithTakeProfitAndOrStopLossOrderAttached` tool, using the CCXT feature described [here](https://docs.ccxt.com/#/README?id=stoploss-and-takeprofit-orders-attached-to-a-position).

- **Margin mode:** Bybit allows switching margin mode (at the account level) as long as the trader has sufficient margin and the change itself doesn't trigger immediate liquidation.

- **Order object:** The Bybit API upon order creation only returns the order ID, not the order object ([docs](https://bybit-exchange.github.io/docs/v5/order/create-order)). Hence, after creating an order, we always use the `getOrderById` tool to fetch the order object.

- **Trigger direction:** Trigger direction is needed when placing trigger orders (https://discord.com/channels/690203284119617602/690203284727660739/1367189081418633389)

- **Limit orders with TP/SL:** Limit orders with TP/SL (regardless of spot or futures) appear as a single order both in the API and in the UI; for futures orders, the "Trade Type" is set to "Open long" or "Open short" ([spot screenshot](https://d.pr/i/n1b05r), [futures screenshot](https://d.pr/i/nWzWRG)). When the main order is filled, the TP/SL orders will still appear as a single separate TP/SL order ([spot screenshot](https://d.pr/i/yJtL3X)); for futures orders it will have the "Trade Type" set to "Close long" or "Close short".

- **TP/SL order in UI:** When adding a TP/SL order to an existing position (or creating a new position with TP/SL attached) the TP/SL will appear in the UI as a single order (see [screenshot](https://d.pr/i/CgH0vF)).

- **Settlement coin:** When listing orders and positions, Bybit requires the `settleCoin` parameter, therefore it is needed to loop through settlement coins. This integration supports USDC and USDT as settlement coins, via the `SUPPORTED_SETTLE_CURRENCIES` constant.

- **Trailing stop:** For futures, a trailing stop is treated as a position-level stop-loss rather than a standalone order, with the endpoint /v5/position/trading-stop. You cannot place a trailing stop as part of an initial order; instead, you set or update a trailing stop after a position is open (this mirrors the web UI, where trailing stop is a closing strategy on open positions). For spot markets, trailing stop orders are placed as standalone conditional orders, via the endpoint /v5/order/create.

- **Trailing stop:** For both spot and futures, the trailing stop has to be indicated as an absolute distance from the current price.

- **Order visibility:** Orders that are not in the last 500 orders (of any status) are not accessible via the API.

- **Order information:** To fetch information about a specific order, it is not sufficient to know the ID and the market symbol: we also need to specify whether the order is a trigger order or not.

- **Leverage tiers:** The `fetchLeverageTiers` method is supported by CCXT, but it takes forever as it goes through 40 pages of markets, so we just infer the max leverage from the market object, without showing the actual tier for that leverage.

- **CCXT gaps:** Had to implement the following functions in [exchange.ts](./src/helpers/exchange.ts) to cover the gaps in CCXT:

    - `attachTakeProfitAndOrStopLossOrderToExistingPosition`
    - `attachTrailingStopToExistingPosition`
    - `getAccountMarginMode`
    - `addOrReducePositionMargin`
    - `getUserOpenOrders`
    - `getOrderById`

- **API key expiration:** Bybit API keys expire after 3 months unless one adds IP whitelisting

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
