## Bug fixes

- With complex commands like "Long 1 BTC, then place an order to close the position at 10% profit" the LLM arbitrarily decides to change the leverage and/or the margin mode
- Include trailing percent in the order formatting function

## Features

- Test future non-perpetual contracts
- Add margin to isolated positions
- Reduce margin from isolated positions

## Minor

- Is limit supported on trailing stop orders?
- Test transferFunds function on mainnet (testnet does not have spot account)

## Future

- Should TP and SL orders be always reduceOnly?
- Implement open positions pagination
- Support for hedged positions (2 positions on the same market, one long, one short)
- Open orders pagination
- Open positions pagination
- Transfer to/from isolated margin, via 'params' field in `transfer` function
- Show margin ratio in position output, and allow to show positions at risk of liquidation
- Support [Split Trading](https://www.binance.com/en/support/faq/detail/717a9635f035490baffa564e2f19c7c1), i.e. TP/SL that applies only to a part of the position
- Include position information in order output (e.g. size, PnL if order executes, etc)
