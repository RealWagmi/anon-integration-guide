# Hypersonic DEX aggregator integration

## Overview

[Hypersonic](https://hypersonic.exchange) optimizes DEX trading on EVM chains using advanced routing and real-time market data to deliver best execution across multiple liquidity sources. Available via [UI](https://hypersonic.exchange/$) & [API](https://docs.hypersonic.exchange/api-reference).

### Main Features
- Smart route optimization across multiple DEXs
- Best price execution through liquidity aggregation
- Minimal slippage with optimized routing
- Simple API integration

### Supported Networks
- SONIC (Chain ID: 146)

### Supported DEXs for Routing
- SolidlyV3
- SpookySwapV2
- SpookySwapV3
- MetropolisV2
- MetropolisDLMMLB
- DyorswapV2
- WagmiV3
- MemeboxV2
- EqualizerV3
- SliverswapAlgrebra
- SonicMarketV2
- SonicMarketLB
- ShadowV3
- ShadowV2
- WoofiPPV2
- SwapXV4
- CurveStableswap
- CurveTwoCrypto
- CurveTriCrypto
- BeetsV2

## Example Operations

1. Price Quotes:
   - "Get quote for swapping 1 wS to USDT"
   - "Check price for trading 1000 USDCe to WETH"
   - "Find best rate for exchanging Anon to BOO"
   - "Calculate expected output for swapping 5 wS to BEETS"

2. Token Swaps:
   - "Swap 1 wS for USDT"
   - "Exchange 1000 USDCe for WETH"
   - "Trade my Anon tokens for BOO"
   - "Swap exactly 5 wS to BEETS"

3. Information Queries:
   - "Show supported tokens on Hypersonic"
   - "Explain how Hypersonic works"
   - "Get details about Hypersonic DEX aggregator"

## Pain Points Solved

1. Price Optimization
   - Eliminates manual DEX comparison
   - Finds best available rates automatically
   - Reduces price impact through smart routing

2. Execution Efficiency
   - Simplifies complex multi-hop trades
   - Handles token approvals automatically
   - Optimizes gas usage through route selection

3. User Experience
   - Single interface for multiple DEXs
   - Simplified trading process
   - Reliable execution with fixed slippage

## Installation
 
```bash
pnpm add @heyanon/hypersonic
```

## Supported Functions

- `Quote()` -> Gets the best price quote for a token swap.
- `Swap()` -> Executes a token swap with the best available route.

## Development

1. Install dependencies:
```bash
pnpm install
```

2. Build the project:
```bash
pnpm run build
```

3. Run tests:
```bash
pnpm test
```
