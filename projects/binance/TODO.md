## Bug fixes

- Trailing stop orders

## Features

- A separate tool for each order type - will it make it simpler for the LLM to understand?
- Test stop loss orders
- Test take profit orders
- Edit order & understand how to implement reduce only
- Check against exchange.features whether the submitted order is supported
- Make sure HeyAnon supports nested properties in OpenAI tool definition (e.g. for trailing stop orders creation)

## Minor

- Specify in README that integration is for above 1hour timeframes only (see https://docs.ccxt.com/#/?id=notes-on-latency)
- Should we handle API key errors such as [this one](https://d.pr/i/bKUK9j)?

## Future

- Test trailing stop orders
- OCO and TWAP orders
- Options trading
- Spot with margin
- Implement open orders pagination
- Should we stop the user from creating limit orders that will execute immediately (e.g. limit buy at price higher than market price)?
- More meaningful error messages: `BadRequest: binance {"code":-1013,"msg":"Filter failure: NOTIONAL"}` should be "Order too small for this market"
