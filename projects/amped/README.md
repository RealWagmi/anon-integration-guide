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

### Liquidity Management
- `addLiquidity`: Add tokens as liquidity to Amped Finance, receiving ALP tokens in return.
- `removeLiquidity`: Remove liquidity by redeeming ALP tokens for any supported token.
- `getUserLiquidity`: Get user's current liquidity position and ALP token balance.
- `getPoolLiquidity`: Get current liquidity pool information and token balances.
- `getUserTokenBalances`: Get balances and USD values of all supported tokens for a specific user.

### Trading Operations
- `openPosition`: Open a leveraged long or short position with specified collateral.
- `closePosition`: Close one or more leveraged positions, fully or partially.
- `getAllOpenPositions`: Get all open positions for a specific account.
- `getPosition`: Get detailed information about a specific position.
- `marketSwap`: Execute a market swap between two tokens.

### Information & Analytics
- `getPoolLiquidity`: Get total pool liquidity information including ALP supply and Assets Under Management (AUM).
- `getALPApr`: Calculate and retrieve the current APR for ALP tokens.
- `getEarnings`: Get earnings information for a user's positions and liquidity.
- `getPerpsLiquidity`: Get available liquidity information for perpetual trading.
- `getSwapsLiquidity`: Get information about available liquidity for token swaps.

### Rewards
- `claimRewards`: Claim any available rewards from liquidity provision or trading.

## What You Need to Know

1. Liquidity
   - You can add any supported token as liquidity (e.g. S, EURC, USDC, ANON, WETH on Sonic)
   - You receive ALP tokens in return
   - ALP tokens can be redeemed later for any supported token

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