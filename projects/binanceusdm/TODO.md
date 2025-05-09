## Bug fixes

- Make sure to respect [limits & precision rules](https://docs.ccxt.com/#/README?id=notes-on-precision-and-limits). See also [here](https://github.com/webcerebrium/java-binance-api/issues/7#issuecomment-1076805294)
- Include trailing percent in the order formatting function
- Before publishing PR, harmonize JSDocs and Props in tool implementations

## Features

- Make sure HeyAnon supports nested properties in OpenAI tool definition (e.g. for trailing stop orders creation)

## Minor

- Test transferFunds function on mainnet (testnet does not have spot account)

## Future

- Support for future non-perpetual contracts
- Implement open positions pagination
- Open orders pagination
- Open positions pagination
- Transfer to/from isolated margin, via 'params' field in `transfer` function
- Show margin ratio in position output, and allow to show positions at risk of liquidation
- Support for hedged positions (e.g. 2 positions on the same market, one long, one short)
- Support [Split Trading](https://www.binance.com/en/support/faq/detail/717a9635f035490baffa564e2f19c7c1), i.e. TP/SL that applies only to a part of the position
- Include position information in order output (e.g. size, PnL if order executes, etc)
