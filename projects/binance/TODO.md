## Bug fixes

- Convert OCO orders response to CCXT Order objects

## Features

- Test OCO orders for buy
- Trailing stop orders
- Edit order & reduce only
- Check against exchange.features whether the submitted order is supported
- Make sure HeyAnon supports nested properties in OpenAI tool definition (e.g. for trailing stop orders creation)

## Minor

## Future

- Trailing stop support in OCO orders
- TWAP orders
- OTOCO orders to do stuff like "Buy 1 BTC/USDT, then place a 10% take profit and a 15% stop loss" in a single go, avoiding potential issues with price changes and fund unavailability
- OTO orders to do stuff like "Buy 1 BTC/USDT, then place a 15% stop loss" in single go, avoiding potential issues with price changes and fund unavailability
- Options trading
- Spot with margin
- Implement open orders pagination
- Should we stop the user from creating limit orders that will execute immediately (e.g. limit buy at price higher than market price)?
- More meaningful error messages, for example:
    - `BadRequest: binance {"code":-1013,"msg":"Filter failure: NOTIONAL"}` should be "Order too small for this market"
    - API key errors such as [this one](https://d.pr/i/bKUK9j)
