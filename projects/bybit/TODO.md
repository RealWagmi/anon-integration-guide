## Bug fixes

- `cancelAllOrdersOnMarket` does not seem to work

## Features

## Minor

## Future

- Support for market buys with amount in quote currency using `createMarketBuyOrderRequiresPrice=false` (https://docs.ccxt.com/#/README?id=market-buys)
- Support inverse markets
- Check validity of margin metric in portfolio margin mode (list positions)
- Reduce only orders
- Allow to get market funding rates
- Support for hedged positions (2 positions on the same market, one long, one short)
- Open orders pagination
- Open positions pagination
- Show margin ratio in position output, and allow to show positions at risk of liquidation
- Include position information in order output (e.g. size, PnL if order executes, etc)
