# Hyperliquid

Integration with Hyperliquid

## Overview

Hyperliquid is a performant L1 optimized from the ground up. The vision is a fully onchain open financial system with user built applications interfacing with performant native components, all without compromising end user experience. The Hyperliquid L1 is performant enough to operate an entire ecosystem of permissionless financial applications – every order, cancel, trade, and liquidation happens transparently on-chain with block latency <1 second. The chain currently supports 100k orders / second.

The Hyperliquid L1 uses a custom consensus algorithm called HyperBFT which is heavily inspired by Hotstuff and its successors. Both the algorithm and networking stack are optimized from the ground up to support the L1. The flagship native application is a fully onchain order book perpetuals exchange, the Hyperliquid DEX. Further developments include a native token standard, spot trading, permissionless liquidity, etc.

## Supported Networks

-   ARBITRUM

## Common Tasks

-   "Bridge 100 USDC to Hyperliquid from Arbitrum network"
-   "Move 50 USDC from Arbitrum network to Hyperliquid"
-   "Send 25.5 USDC to Hyperliquid bridge on Arbitrum network"

## Available Functions (so far)

-   Bridging to Hyperliquid

## Tests

To run tests:

```bash
npm test
```

To check test coverage:

```bash
npm run test:coverage
```

## Installation

```bash
yarn add @heyanon/hyperliquid
```

## Note 🚧

We are waiting on signing support on `heyanon-sdk` and then we will add other functionalities.
