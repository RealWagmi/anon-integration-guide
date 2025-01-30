# amped

Integration with Amped Finance

## Supported Networks

- SONIC

## Common Tasks

1. Liquidity Operations
   - "Add 100 USDC as liquidity in Amped on Sonic network"
   - "Remove $50 of liquidity from Amped and get S tokens back"
   - "Check my available liquidity in Amped"

2. Trading Operations
   - "Open a long position worth 100 USD on ANON with 20 USDC as collateral in Amped"
   - "Close my long ANON position in Amped"
   - "Check my open positions in Amped"

3. Information Queries
   - "Show my current positions in Amped"
   - "Check my liquidity pool balance in Amped"
   - "Calculate expected returns for my position in Amped"

## Available Functions

### Adding and Removing Liquidity

1. Add Liquidity
   ```typescript
   // Add 100 USDC as liquidity
   const result = await addLiquidity({
     chainName: 'sonic',
     tokenIn: USDC_ADDRESS,
     amount: '100',
   }, options);
   ```

2. Remove Liquidity
   ```typescript
   // Remove 50 GLP tokens and get USDC back
   const result = await removeLiquidity({
     chainName: 'sonic',
     account: YOUR_ADDRESS,
     tokenOut: USDC_ADDRESS,
     amount: '50'
   }, options);
   ```

### Trading with Leverage

1. Open a Position
   ```typescript
   // Open a 10x long position on ANON using 100 USDC as collateral
   const result = await openPosition({
     chainName: 'sonic',
     account: YOUR_ADDRESS,
     indexToken: ANON_ADDRESS,
     collateralToken: USDC_ADDRESS,
     isLong: true,
     sizeUsd: 1000,        // $1000 position size
     collateralUsd: 100    // $100 collateral = 10x leverage
   }, options);
   ```

2. Close a Position
   ```typescript
   // Close your long ANON position
   const result = await closePosition({
     chainName: 'sonic',
     account: YOUR_ADDRESS,
     indexToken: ANON_ADDRESS,
     collateralToken: USDC_ADDRESS,
     isLong: true
   }, options);
   ```

## What You Need to Know

1. Liquidity
   - You can add any supported token as liquidity (e.g. S, EURC, USDC, ANON, WETH on Sonic)
   - You receive ALP tokens in return
   - ALP tokens can be redeemed later for any supported token
   - Minimum liquidity amount is $10

2. Trading
   - You can trade with up to 11x leverage
   - Minimum leverage size is 1.1x
   - Minimum collateral is $10
   - Available tokens for longs: S, ANON, WETH
   - Available tokens for shorts: USDC, EURC

3. Safety Limits
   - Default slippage protection is 0.3%
   - Position sizes are limited by available liquidity
   - Leverage is limited based on token and position size

## Installation

```bash
yarn add @heyanon/amped
```

## Common Errors and Solutions

1. "Insufficient liquidity"
   - Try a smaller position size
   - Try a different token
   - Wait for more liquidity to become available

2. "Position size too small"
   - Minimum position size is $11
   - Increase your position size

3. "Insufficient collateral"
   - Minimum collateral is $10
   - Increase your collateral amount

4. "Leverage too high"
   - Maximum leverage varies by token
   - Try reducing your leverage
   - Or increase your collateral

