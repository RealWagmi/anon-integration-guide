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
-   "Withdraw 20 USDC from Hyperliquid to Arbitrum"
-   "Move 10.5 USDC from Hyperliquid back to Arbitrum"

## Available Functions

-   Bridging to Hyperliquid (minimum 5 USDC)
-   Withdrawing from Hyperliquid (minimum 2 USDC)

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

## Usage

### Bridging USDC to Hyperliquid

```typescript
// Bridge USDC from Arbitrum to Hyperliquid
await bridgeToHyperliquid({
    chainName: 'arbitrum',
    account: '0x...',
    amount: '10', // Amount in USDC
});
```

### Withdrawing USDC from Hyperliquid

```typescript
// Withdraw USDC from Hyperliquid to Arbitrum
await withdrawFromHyperliquid({
    chainName: 'hyperliquid',
    account: '0x...',
    amount: '5', // Amount in USDC
});
```

## Note

Trading functionality development is in progress. Next features will include order management, position tracking, and advanced trading operations.
