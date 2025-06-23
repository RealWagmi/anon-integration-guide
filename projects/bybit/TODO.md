## Bug fixes

- Sort out what "Buy 1 BTC with 10% TP and 15% SL" means
- Check orderId returned by all exchange.ts functions

## Features

- Set TP/SL orders for spot (createSpotTakeProfitAndOrStopLossOrder)
- Are inverse markets supported? If not, throw when marketObject.subType is inverse
- Test reduce only (see _When it is clear from context_ in README.md)

## Minor

## Future

- Support for market buys with amount in quote currency using `createMarketBuyOrderRequiresPrice=false` (https://docs.ccxt.com/#/README?id=market-buys)
- Support inverse markets
- Check validity of margin metric in portfolio margin mode (list positions)
- Include trailing percent in the order formatting function
- Allow to get market funding rates
- Support for hedged positions (2 positions on the same market, one long, one short)
- Open orders pagination
- Open positions pagination
- Show margin ratio in position output, and allow to show positions at risk of liquidation
- Include position information in order output (e.g. size, PnL if order executes, etc)
