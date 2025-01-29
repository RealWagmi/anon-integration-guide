# curve-finance

Integration to Swap and LP functionalities on Curve

## Supported Networks

- ETHEREUM
- ARBITRUM

## Common Tasks

1. Swapping
   - "Swap 1000 USDT to USDC in @curve-finance tripool on Ethereum"
   - "Exchange 500 DAI for USDT using @curve-finance on Arbitrum"
   - "Get the best exchange rate for swapping 100 USDC to DAI in @curve-finance"

2. Liquidity Provision
   - "Add liquidity to @curve-finance tripool with 1000 USDT and 1000 USDC"
   - "Remove my liquidity from @curve-finance pool"
   - "Withdraw 500 LP tokens from @curve-finance pool as USDT only"
   - "Check my LP token balance in @curve-finance tripool"

3. Information Queries
   - "Show current exchange rate for USDT to USDC in @curve-finance pool"
   - "Get the virtual price of @curve-finance tripool"
   - "Display my pool share in @curve-finance tripool"
   - "Calculate expected tokens for removing liquidity in @curve-finance"

## Available Functions

### Swap Operations
```typescript
swap({
    chainName: string,
    poolAddress: string,
    fromToken: number,
    toToken: number,
    amount: string,
    slippage: string,
    userAddress: string
})
```
Example: Swap 1000 USDT (token0) to USDC (token1)

```typescript
swap({
    chainName: "ETHEREUM",
    poolAddress: "0x...", // pool address
    fromToken: 0,
    toToken: 1,
    amount: "1000",
    slippage: "0.5",
    userAddress: "0x..." // your wallet address
})
```

### Liquidity Management
```typescript
addLiquidity({
    chainName: string,
    poolAddress: string,
    amounts: string[],
    slippage: string,
    userAddress: string
})

removeLiquidity({
    chainName: string,
    poolAddress: string,
    lpAmount: string,
    minAmounts: string[],
    userAddress: string
})

removeLiquidityOneCoin({
    chainName: string,
    poolAddress: string,
    lpAmount: string,
    tokenIndex: number,
    minAmount: string,
    userAddress: string
})
```

Example: Add liquidity with equal amounts
```typescript
addLiquidity({
    chainName: "ETHEREUM",
    poolAddress: "0x...", // pool address
    amounts: ["1000", "1000", "1000"], // Equal amounts of each token
    slippage: "0.5",
    userAddress: "0x..." // your wallet address
})
```

### Information Queries
```typescript
getExchangeRate({
    chainName: string,
    poolAddress: string,
    fromToken: number,
    toToken: number,
    amount: string
})

getVirtualPrice({
    chainName: string,
    poolAddress: string
})

getLPTokenBalance({
    chainName: string,
    poolAddress: string,
    userAddress: string
})
```

Example: Check exchange rate
```typescript
getExchangeRate({
    chainName: "ETHEREUM",
    poolAddress: "0x...", // pool address
    fromToken: 0,
    toToken: 1,
    amount: "1000"
})
```

## Installation
```bash
yarn add @heyanon/curve-finance
```

## Usage

1. Import required functions:
```typescript
import { 
    swap, 
    addLiquidity, 
    removeLiquidity, 
    getExchangeRate 
} from '@heyanon/curve-finance';
```

2. Initialize with pool address:
```typescript
const POOL_ADDRESS = "0x..."; // Your target pool address
```

3. Execute operations:
```typescript
// Swap tokens
const swapResult = await swap({
    chainName: "ETHEREUM",
    poolAddress: POOL_ADDRESS,
    fromToken: 0,
    toToken: 1,
    amount: "1000",
    slippage: "0.5",
    userAddress: "0x..." // your wallet address
});

// Check rates before swapping
const rateInfo = await getExchangeRate({
    chainName: "ETHEREUM",
    poolAddress: POOL_ADDRESS,
    fromToken: 0,
    toToken: 1,
    amount: "1000"
});

// Add liquidity
const addLiquidityResult = await addLiquidity({
    chainName: "ETHEREUM",
    poolAddress: POOL_ADDRESS,
    amounts: ["1000", "1000", "1000"],
    slippage: "0.5",
    userAddress: "0x..." // your wallet address
});

// Check LP balance
const balanceInfo = await getLPTokenBalance({
    chainName: "ETHEREUM",
    poolAddress: POOL_ADDRESS,
    userAddress: "0x..." // your wallet address
});
```

## Notes
- Token indices (fromToken, toToken) correspond to the order of tokens in the pool
- Slippage is specified as a percentage string (e.g., "0.5" for 0.5%)
- Amounts should be provided in decimal format (e.g., "1000" for 1000 tokens)
- All functions handle proper approval of tokens when needed