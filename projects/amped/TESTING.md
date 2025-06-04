# Testing Amped Finance Functions

This guide explains how to test the Amped Finance integration functions.

## Prerequisites

1. Ensure you have a `.env` file with at least one of the following:

   **Option A: Private Key (recommended)**
   ```
   PRIVATE_KEY=your_private_key_here
   ```
   The test suite will automatically derive the account address from your private key.

   **Option B: Direct Account Address**
   ```
   TEST_ACCOUNT=0x...
   # or
   ACCOUNT_ADDRESS=0x...
   ```
   Use this if you want to test read-only functions without a private key.

## Available Functions

### Liquidity Functions
- `getPoolLiquidity` - Get overall pool liquidity information
- `getUserLiquidity` - Get user's ALP balance and liquidity info
- `getUserTokenBalances` - Get all token balances for a user
- `getEarnings` - Get user's earnings from providing liquidity
- `getALPAPR` - Get current APR for ALP tokens
- `addLiquidity` - Add liquidity to the pool
- `removeLiquidity` - Remove liquidity from the pool
- `claimRewards` - Claim accumulated rewards

### Trading Functions
- `getSwapsLiquidity` - Get available liquidity for token swaps
- `marketSwap` - Perform a token swap
- `getPerpsLiquidity` - Get perpetual trading liquidity info
- `getAllOpenPositions` - Get all open perpetual positions
- `getPosition` - Get details of a specific position
- `openPosition` - Open a new perpetual position
- `closePosition` - Close an existing position

## Testing with Direct Function Call Script

The project includes a direct function call script that allows testing individual functions.

### Basic Usage

```bash
npm run function -- <functionName> <param1>=<value1> <param2>=<value2>
```

### Examples

#### 1. Get Pool Liquidity
```bash
npm run function -- getPoolLiquidity chainName=sonic
```

#### 2. Get User Token Balances
```bash
npm run function -- getUserTokenBalances chainName=sonic account=0xYourAddress
```

#### 3. Get User Liquidity
```bash
npm run function -- getUserLiquidity chainName=sonic account=0xYourAddress
```

#### 4. Get ALP APR
```bash
npm run function -- getALPAPR chainName=sonic account=0xYourAddress
```

#### 5. Get Swaps Liquidity
```bash
npm run function -- getSwapsLiquidity chainName=sonic account=0xYourAddress
```

#### 6. Get Perps Liquidity
```bash
# For long positions
npm run function -- getPerpsLiquidity chainName=sonic account=0xYourAddress indexToken=WETH isLong=true

# For short positions
npm run function -- getPerpsLiquidity chainName=sonic account=0xYourAddress indexToken=USDC isLong=false
```

#### 7. Get All Open Positions
```bash
npm run function -- getAllOpenPositions chainName=sonic account=0xYourAddress
```

#### 8. Get Specific Position
```bash
npm run function -- getPosition chainName=sonic account=0xYourAddress tokenSymbol=WETH collateralTokenSymbol=USDC isLong=true
```

## State-Changing Functions (Use with Caution)

These functions will execute actual transactions on the blockchain:

#### Add Liquidity
```bash
# With specific amount
npm run function -- addLiquidity chainName=sonic account=0xYourAddress tokenSymbol=USDC amount=10 minUsdg=0 minGlp=0

# With percentage of balance
npm run function -- addLiquidity chainName=sonic account=0xYourAddress tokenSymbol=USDC percentOfBalance=10 minUsdg=0 minGlp=0
```

#### Remove Liquidity
```bash
npm run function -- removeLiquidity chainName=sonic account=0xYourAddress tokenOutSymbol=USDC amount=5 slippageTolerance=0.5
```

#### Market Swap
```bash
npm run function -- marketSwap chainName=sonic account=0xYourAddress tokenIn=USDC tokenOut=WETH amountIn=100 slippageBps=100
```

#### Open Position
```bash
npm run function -- openPosition chainName=sonic account=0xYourAddress tokenSymbol=WETH collateralTokenSymbol=USDC isLong=true sizeUsd=100 collateralUsd=20 slippageBps=30
```

#### Close Position
```bash
npm run function -- closePosition chainName=sonic account=0xYourAddress slippageBps=30
```

## Automated Test Suite

Run all read-only functions in sequence:
```bash
npm run test:all
```

This will test all functions that don't modify blockchain state.

## Troubleshooting

1. **"Wallet not connected"** - Ensure PRIVATE_KEY is set in .env
2. **"Invalid account address"** - Ensure account parameter is a valid address
3. **"Network not supported"** - Currently only 'sonic' and 'base' are supported
4. **Transaction failures** - Check you have sufficient balance and gas

## Integration with Heyanon SDK

These functions are designed to work within the Heyanon SDK ecosystem. When integrated:
- The SDK provides wallet connection and transaction management
- Functions receive proper `FunctionOptions` with notify, getProvider, and sendTransactions
- Error handling and user notifications are managed by the SDK

For SDK integration testing, refer to the Heyanon SDK documentation.