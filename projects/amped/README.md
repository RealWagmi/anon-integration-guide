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

### Basic Liquidity Operations

// Add liquidity
"Add 100 USDC as liquidity in Amped on Sonic network"
Parameters:
- Chain: sonic
- TokenIn: USDC address (0x...)
- Amount: 100 USDC
- MinLpOut: Calculated with default 0.3% slippage

// Remove liquidity
"Remove $50 of liquidity from Amped and get USDC back"
Parameters:
- Chain: sonic
- TokenOut: USDC address
- Amount: $50 worth of ALP tokens

### Trading Operations

// Open leveraged position
"Open a long position worth 1000 USD on ANON with 100 USDC as collateral"
Parameters:
- Chain: sonic
- Account: User's address
- IndexToken: ANON address
- CollateralToken: USDC address
- IsLong: true
- SizeUsd: 1000 (position size)
- CollateralUsd: 100 (10x leverage)
- MaxSlippage: 0.3%

// Close position
"Close my long ANON position in Amped"
Parameters:
- Chain: sonic
- IndexToken: ANON
- IsLong: true

### Information Queries

// Check available liquidity
"Check available liquidity for trading"
Parameters:
- Chain: sonic
- Token: specify token (optional)

// Get position details
"Show my current open positions"
Parameters:
- Chain: sonic
- Account: User's address

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
   - Available collateral and indextokens for longs: S, ANON, WETH
   - Available collateral tokens for shorts: USDC, EURC

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

