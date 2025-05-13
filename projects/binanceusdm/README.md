# Binance USDM Futures Trading

Integration between HeyAnon.ai and Binance USDM Futures trading.

## Common Tasks

### Markets

- Show all BTC future markets on @binanceusdm
- Show last price and volume of BTC/USDT on @binanceusdm
- Show max leverage for BTC/USDT on @binanceusdm

### Info on positions and balances

- Show all my positions on @binanceusdm
- Show my BTC/USDT position on @binanceusdm
- Show all of my BTC positions on @binanceusdm

### Info on open orders

- Show all my open orders on @binanceusdm
- Show my BTC open orders on @binanceusdm
- Show details on order 232168017 on @binanceusdm
- Show my balance on @binanceusdm

### Transfer funds between accounts

- Transfer 5,000 USDT to my futures account on @binanceusdm
- Transfer all my USDT from my futures account to my spot account on @binanceusdm

### Market & limit orders

- Long 1 BTC with USDT on @binanceusdm
- Long 1 BTC with USDT with isolated margin on @binanceusdm
- 100x long 1 BTC with USDT on @binanceusdm
- Long 1 BTC at limit price of 40,000 USDT on @binanceusdm
- Short BTC with limit price of 150,000 USDT on @binanceusdm

**IMPORTANT:** If you specify a leverage (5x, 10x, etc) or a margin mode (cross, isolated) for your order, the specified leverage and margin mode will be applied to the whole position, and not just to the amount you are adding/removing. This is because on Binance the leverage and margin mode are applied at the market level, and not at the order level. For more details, see the [Leverage and margin mode](#changing-leverage-and-margin-mode) section.

### Leverage and margin

- **TODO:** Add 100 USDT margin to my BTC/USDT position on on @binanceusdm
- **TODO:** Remove 200 USDT margin from my BTC/USDT position on on @binanceusdm
- What is my BTC/USDT leverage on @binanceusdm?
- What is my BTC/USDT margin mode on @binanceusdm?
- Set 50x leverage on BTC/USDT on @binanceusdm
- Set isolated margin mode on BTC/USDT on @binanceusdm
- Set cross margin mode on BTC/USDT on @binanceusdm

**IMPORTANT**: The above commands change the market-level leverage and margin mode, which will affect your existing position in that market. See the [Leverage and margin mode](#changing-leverage-and-margin-mode) section for more details.

### Conditional orders

- Long 1 BTC on @binanceusdm when the price crosses 50,000 USDT
- Long 1 BTC at 45,000 USDT on @binanceusdm when the price crosses 50,000 USDT

### Stop Loss & Take Profit

- Add a 10% TP and a 15% SL to my existing BTC/USDT position
- 20x long 1 BTC with USDT, then place a stop loss at 15% and three take profit targets at 10%-20%-30%
- Short 1 BTC with USDT, then place an order to close the position at 10% profit on @binanceusdm
- Long 1 BTC with USDT, then place a 10% take profit and 15% stop loss on @binanceusdm

When it is clear from context that the TP and SL orders are attached to a position, they will be issued as **reduce-only** orders, to prevent accidentally increase the position size or open a new position.  To force a reduce only order, just ask for it, e.g. 

- Long 1 BTC on @binanceusdm when the price crosses 50,000 USDT, *reduce only*

### Trailing stop orders

- **TODO:** Place an order to short 1 BTC for USDT with a trailing take profit of 10%
- **TODO:** Place an order to short 1 BTC @ 100,000 USDT with a trailing take profit of 10%
- **TODO:** Place an order to short 1 BTC for USDT with a trailing take loss of 10%
- **TODO:** Place an order to short 1 BTC @ 50,000 USDT with a trailing take loss of 10%
- **TODO:** Place an order to long 1 BTC with USDT with a trailing take profit of 10%
- **TODO:** Place an order to long 1 BTC with USDT with a trailing stop loss of 10%

### Close positions

- Close my BTC/USDT position on @binanceusdm
- Close all my positions on @binanceusdm
- Close all of my BTC positions on @binanceusdm

### Cancel orders

- Cancel all my orders on @binanceusdm
- Cancel all my orders on BTC/USDT on @binanceusdm
- Cancel order 232168017 on @binanceusdm

## Changing leverage and margin mode

When you create a position without specifying the leverage or the margin mode, the position will be created with whatever is the current configuration for the market.

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

Things are simpler when it comes to **changing the margin mode**: Binance does not allow you to change the margin mode of a market if you have an open position in that market.

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

- Binance fAPI does not support OTOCO orders, that is, the creation in one go of position + TP + SL. Therefore, we send 3 separate orders ([link](https://dev.binance.vision/t/how-to-implement-otoco-tp-sl-orders-using-api/1622/14)).
- Binance fAPI does not support `fetchPosition` for future and perpetual markets, see workaround in `getUserOpenPositionBySymbol`
- Binance fAPI does not support `closePosition`, see workaround in `closePositionBySendingOppositeMarketOrder`
- In Binance it seems the settle currency is always the same as the quote currency. When implementing other exchanges, if this is not the case, we should consider reviewing the `completeMarketSymbol` function.

## Reference

- [Binance future types of orders](https://www.binance.com/en/support/faq/detail/360033779452)
- [Binance fAPI docs](https://developers.binance.com/docs/derivatives/usds-margined-futures/general-info)
- [Binance fAPI orders](https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api)
- [Binance Futures FAQ](https://www.binance.com/en/blog/futures/10-most-frequently-asked-questions-about-binance-futures-421499824684903916)
- [Binance max leverage table](https://www.binance.com/en/futures/trading-rules/perpetual/leverage-margin)
- [CCXT leverage tiers](https://docs.ccxt.com/#/README?id=leverage-tiers)
- [CCXT Order structure](https://docs.ccxt.com/#/?id=order-structure)
- [CCXT Querying orders](https://docs.ccxt.com/#/README?id=querying-orders)
- [CCXT Placing orders](https://docs.ccxt.com/#/README?id=placing-orders)
- [CCXT Conditional/trigger orders](https://docs.ccxt.com/#/README?id=conditional-orders)
- [CCXT Binance createOrder](https://docs.ccxt.com/#/exchanges/binance?id=createorder)
- [Isolated margin order](https://discord.com/channels/690203284119617602/690203284727660739/1119234330775007262)
