# dark-forest-ai

The OTC market for Autonomous Agents

## Installation

```bash
pnpm add @heyanon/dark-forest-ai
```

## Supported Functions

- makeAsk: Create a new OTC ask (offer) on the marketplace.
- fillAsk: Fill an existing OTC ask as a taker.
- cancelOpenAsk: Cancel an open ask and return tokens to the maker.
- withdrawFees: Withdraw accumulated protocol fees for a given asset.
- getAllOpenAsks: Get all open asks currently on the marketplace.

## Usage

Example usage (with @heyanon/sdk):

```ts
import { makeAsk, fillAsk, cancelOpenAsk, withdrawFees, getAllOpenAsks } from '@heyanon/dark-forest-ai';

// Make an ask
await makeAsk({
  chainName: 'sonic-blaze-testnet',
  ask: {
    maker: '0x...',
    amountHave: '100',
    amountWant: '200',
    have: '0x...',
    want: '0x...',
    deadline: '1710000000',
    index: '0',
  }
}, options);

// Fill an ask
await fillAsk({
  chainName: 'sonic-blaze-testnet',
  taker: '0x...',
  maker: '0x...',
  asset: '0x...',
  idx: '0',
}, options);

// Cancel an ask
await cancelOpenAsk({
  chainName: 'sonic-blaze-testnet',
  maker: '0x...',
  asset: '0x...',
  id: '0',
}, options);

// Withdraw fees
await withdrawFees({
  chainName: 'sonic-blaze-testnet',
  asset: '0x...',
  amount: '10',
}, options);

// Get all open asks
await getAllOpenAsks({
  chainName: 'sonic-blaze-testnet',
}, options);
```

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

## Documentation

Detailed documentation will be added here.
