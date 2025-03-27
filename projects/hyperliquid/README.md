# Hyperliquid

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
-   "Move 100 USDC from my spot to my perp balance on Hyperliquid"
-   "I need you to transfer 55.5 USD from perps to spot on Hyperliquid"
-   "Open a long on 12$ of BTC with no leverage on Hyperliquid"
-   "Short me 1 BTC with 50x leverage on Hyperliquid"
-   "Close my ARB position on Hyperliquid"
-   "Close my Bitcoin position on Hyperliquid"
-   "Check my perpetual positions on Hyperliquid"
-   "Show my spot balances on Hyperliquid"
-   "What's my available balance in my Hyperliquid perpetual account?"
-   "Create a vault named 'MyVault' with 200 USD and description 'My trading vault' on Hyperliquid"
-   "Deposit 50 USD into MyVault on Hyperliquid"
-   "Withdraw 30 USD from MyVault on Hyperliquid"
-   "Distribute 100 USD from MyVault to its depositors"
-   "Close MyVault on Hyperliquid"
-   "List all vaults I manage on Hyperliquid"
-   "Increase my ETH perp position by 50% on Hyperliquid"
-   "Decrease my BTC perp position by 25% on Hyperliquid"
-   "Toggle deposits off for MyVault on Hyperliquid"

## Available Functions

-   Bridging to Hyperliquid (minimum 5 USDC)
-   Withdrawing from Hyperliquid (minimum 2 USDC)
-   Moving USDC between spot and perp balances on Hyperliquid
-   Opening and closing perp positions on Hyperliquid
-   Modifying perp positions by USD or token amount
-   Increasing or decreasing perp positions by percentage/multiplier
-   Creating, managing, and closing vaults on Hyperliquid
-   Depositing into and withdrawing from vaults
-   Distributing vault funds to depositors
-   Toggling vault deposit and auto-close settings
-   Retrieving perpetual positions, balances, spot balances, and managed vaults

## Tests

To run tests:

```bash
pnpm test
```

To check test coverage:

```bash
pnpm run test:coverage
```

## Installation

```bash
pnpm add @heyanon/hyperliquid
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
    chainName: 'arbitrum',
    account: '0x...',
    amount: '5', // Amount in USDC
});
```

### Moving USDC from spot to perp balance on Hyperliquid

```typescript
// Move funds from spot to perp account
await transferToPerpetual({
    amount: '5', // Amount in USDC
});
```

### Moving USDC from perp to spot balance on Hyperliquid

```typescript
// Move funds from perp to spot account
await transferToSpot({
    amount: '900', // Amount in USDC
});
```

### Opening a perp position

```typescript
// Shorts 1000$ of BTC at 50x leverage on Hyperliquid
await openPerp({ account: '0xYourAddress', asset: 'BTC', size: '1000', sizeUnit: 'USD', leverage: 50, short: true });
```

### Closing a perp position

```typescript
// Closes the open ETH perp position on Hyperliquid
await closePerp({ account: '0xYourAddress', asset: 'ETH' });
```

### Modifying a perp position by USD

```typescript
// Increases ETH perp position by 50 USD
await modifyPerpPositionByUSD({ account: '0xYourAddress', asset: 'ETH', size: '50' });
```

### Modifying a perp position by token amount

```typescript
// Decreases BTC perp position by 0.1 BTC
await modifyPerpPositionByTokenAmount({ account: '0xYourAddress', asset: 'BTC', size: '-0.1' });
```

### Increasing a perp position by percentage

```typescript
// Increases ETH perp position by 50%
await increasePerpPositionByMultiplying({ account: '0xYourAddress', asset: 'ETH', sizeMultiplier: '1.5' });
```

### Decreasing a perp position by percentage

```typescript
// Decreases BTC perp position by 25%
await decreasePerpPositionByMultiplying({ account: '0xYourAddress', asset: 'BTC', sizeMultiplier: '0.75' });
```

### Getting perp positions

```typescript
// Retrieves all open perpetual positions
await getPerpPositions({ account: '0xYourAddress' });
```

### Getting spot balances

```typescript
// Retrieves all spot balances
await getSpotBalances({ account: '0xYourAddress' });
```

### Getting perp balance

```typescript
// Retrieves available balance in perpetual trading account
await getPerpBalances({ account: '0xYourAddress' });
```

### Creating a vault

```typescript
// Creates a new vault with 200 USD
await createVault({
    account: '0xYourAddress',
    description: 'My trading vault',
    initialUsd: 200,
    name: 'MyVault',
});
```

### Depositing into a vault

```typescript
// Deposits 50 USD into MyVault
await depositIntoVault({ account: '0xYourAddress', vault: 'MyVault', usd: 50 });
```

### Withdrawing from a vault

```typescript
// Withdraws 30 USD from MyVault
await withdrawFromVault({ account: '0xYourAddress', vault: 'MyVault', usd: 30 });
```

### Distributing vault funds

```typescript
// Distributes 100 USD from MyVault to depositors
await distributeVault({ account: '0xYourAddress', vault: 'MyVault', usd: 100 });
```

### Closing a vault

```typescript
// Closes MyVault
await closeVault({ account: '0xYourAddress', vault: 'MyVault' });
```

### Getting managed vaults

```typescript
// Retrieves all vaults managed by the user
await getUsersVaults({ account: '0xYourAddress' });
```

### Toggling vault deposits

```typescript
// Disables deposits for MyVault
await toggleDepositsEnabled({ account: '0xYourAddress', vault: 'MyVault', value: false });
```
