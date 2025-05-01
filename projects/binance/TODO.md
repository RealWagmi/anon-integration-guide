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
