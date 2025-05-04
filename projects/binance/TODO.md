## Bug fixes

- Make sure to respect [limits & precision rules](https://docs.ccxt.com/#/README?id=notes-on-precision-and-limits). See also [here](https://github.com/webcerebrium/java-binance-api/issues/7#issuecomment-1076805294)
- Include trailing percent in the order formatting function
- Before publishing PR, harmonize JSDocs and Props in tool implementations

## Features

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
- More meaningful error messages, using the [exchange's `exceptions` property](https://github.com/ccxt/ccxt/blob/master/ts/src/binance.ts#L1550), for example:
    - `BadRequest: binance {"code":-1013,"msg":"Filter failure: NOTIONAL"}` should be "Order too small for this market"
    - API key errors such as [this one](https://d.pr/i/bKUK9j)
- In order output, include amount spent/received in quote currency
- Route to binanceusdm exchange when a future tool call is detected, to [improve performance](https://chatgpt.com/c/68165e1a-7cd4-8005-82a7-f557669c2263)
