## Bug fixes

- Include trailing percent in the order formatting function
- Sometimes the LLM makes 2 orders instead of 1 for trailing stop orders, e.g. `pnpm ask-binance "Sell 0.06 AAVE @ 200 USDC with a trailing stop loss of 10%"` Maybe solve action on the tool description?
- Make sure to respect limits & precision rules > https://docs.ccxt.com/#/README?id=notes-on-precision-and-limits . See also https://github.com/webcerebrium/java-binance-api/issues/7#issuecomment-1076805294
- Before publishing PR, harmonize JSDocs and Props in tool implementations

## Features

- Test OCO orders for buy
- Trailing stop orders
- Edit order & reduce only
- Check against exchange.features whether the submitted order is supported
- Make sure HeyAnon supports nested properties in OpenAI tool definition (e.g. for trailing stop orders creation)

## Minor

## Future

- Support for future non-perpetual contracts
- Trailing stop support in OCO orders
- TWAP orders
- OTOCO orders to do stuff like "Buy 1 BTC/USDT, then place a 10% take profit and a 15% stop loss" in a single go, avoiding potential issues with price changes and fund unavailability
- OTO orders to do stuff like "Buy 1 BTC/USDT, then place a 15% stop loss" in single go, avoiding potential issues with price changes and fund unavailability
- Options trading
- Spot with margin
- Implement open orders pagination
- Should we stop the user from creating limit orders that will execute immediately (e.g. limit buy at price higher than market price)?
- More meaningful error messages, using the [exchange's `exceptions` property](https://github.com/ccxt/ccxt/blob/master/ts/src/binance.ts#L1550), for example:
    - `BadRequest: binance {"code":-1013,"msg":"Filter failure: NOTIONAL"}` should be "Order too small for this market"
    - API key errors such as [this one](https://d.pr/i/bKUK9j)
- In order output, include amount spent/received in quote currency
