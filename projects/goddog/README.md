# GODDOG DeFi Integration

A TypeScript-based DeFi integration module for managing Uniswap V3 liquidity and vault operations on Arbitrum.

## Overview

GODDOG simplifies DeFi operations on Arbitrum by providing seamless integration with Uniswap V3 and Charm Finance's Alpha Pro Vault management. The protocol enables:

- One-sided liquidity provision to Uniswap V3 pools
- Uniswap V3 pool creation and management
- Efficient token deposits and withdrawals
- Agent assisted vault rebalancing and management

## Supported Networks
- ✅ Arbitrum One (Chain ID: 42161)
- 🚧 Base (Chain ID: 8453)
- 🚧 Ethereum (Chain ID: 1)
- 🚧 Optimism (Chain ID: 10)

## Common Tasks

1. Position Creation
- "Ape 100K $PEPE into @GODDOG_official on Arbitrum"
- "Create a position with all my $WOJAK using @GODDOG_official"
- "Add my $BOOP bags to @GODDOG_official for extra yields"
- "Start earning with my $BONK through @GODDOG_official"

2. Position Management
- "Check my $PEPE earnings in @GODDOG_official"
- "View my $WOJAK position stats in @GODDOG_official"
- "Rebalance my current @GODDOG_official position"
- "Autocompound my $FLOKI position from @GODDOG_official"

3. Withdrawals
- "Get my $PEPE back from @GODDOG_official"
- "Withdraw half my $SHIB from @GODDOG_official"
- "Exit my $WOJAK position in @GODDOG_official"
- "Claim my earnings from @GODDOG_official"

4. Information Queries
- "What is my APY for $PEPE/$HERMES pair in @GODDOG_official"
- "How much have I earned from my meme positions in @GODDOG_official?"
- "Display my $WOJAK position value in @GODDOG_official"
- "Track my $BOOP gains in @GODDOG_official"

## Core Functions

### addLiquidityOnUniswapV3
One-sided liquidity provision to Uniswap V3 pools.

```typescript
const params = {
    account: "0x...", // Your wallet address
    tokenAddress: "0x...", // Token address to provide liquidity for
    tokenAmount: "0.01", // Amount of tokens to add
    chainId: 42161, // Arbitrum chainId
};

const result = await addLiquidityOnUniswapV3(params, { notify, getProvider, sendTransactions });
```

### createVault
Create and initialize a new vault for liquidity management.

```typescript
const params = {
    account: "0x...", // Your wallet address
    poolAddress: "0x...", // Uniswap V3 pool address
    agentAddress: "0x...", // Address that will call rebalance function
    chainId: 42161, // Arbitrum chainId
};

const result = await createVault(params, { notify, getProvider, sendTransactions });
```

### depositToVault
Deposit tokens to an existing vault.

```typescript
const params = {
    account: "0x...", // Your wallet address
    vaultAddress: "0x...", // Vault address
    amount0: "1", // Amount of token0 to deposit
    amount1: "0.1", // Amount of token1 to deposit
    recipient: "0x...", // Address to receive share tokens
    chainId: 42161, // Arbitrum chainId
};

const result = await depositToVault(params, { notify, getProvider, sendTransactions });
```

### withdrawFromVault
Withdraw tokens from a vault.

```typescript
const params = {
    account: "0x...", // Your wallet address
    vaultAddress: "0x...", // Vault address
    shareAmount: "0.5", // Amount of share tokens to burn
    recipient: "0x...", // Address to receive underlying tokens
    chainId: 42161, // Arbitrum chainId
};

const result = await withdrawFromVault(params, { notify, getProvider, sendTransactions });
```

## Error Handling

All functions return a `FunctionReturn` type:

```typescript
interface FunctionReturn {
    message: string;
    error?: boolean;
}
```

Example:
```typescript
const result = await depositToVault(params, options);
if (result.error) {
    console.error('Operation failed:', result.message);
    return;
}
```

## Installation

```bash
npm install @heyanon/goddog
```

## Dependencies
- @heyanon/sdk: ^2.0.1
- viem: ^2.0.0
- ethers: ^6.13.5

## Testing

```bash
npm install
npm test
```

## License
MIT 