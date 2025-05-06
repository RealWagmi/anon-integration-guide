## Bug fixes

- Make sure to respect [limits & precision rules](https://docs.ccxt.com/#/README?id=notes-on-precision-and-limits). See also [here](https://github.com/webcerebrium/java-binance-api/issues/7#issuecomment-1076805294)
- Include trailing percent in the order formatting function
- Before publishing PR, harmonize JSDocs and Props in tool implementations

## Features

- Make sure HeyAnon supports nested properties in OpenAI tool definition (e.g. for trailing stop orders creation)

## Minor

- Test transferIn and transferOut functions on mainnet (testnet does not have spot account)

## Future

- Support for future non-perpetual contracts
- Implement open positions pagination
- Open orders pagination
- Open positions pagination
