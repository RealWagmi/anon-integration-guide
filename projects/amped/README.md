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
  - "Add 100 USDC as liquidity to Amped on Sonic network"
  - "Use 50% of my ANON balance to provide liquidity in Amped"

- `removeLiquidity`: Remove liquidity by redeeming ALP tokens for any supported token.
  - "Remove 50 ALP tokens from Amped and receive USDC"
  - "Withdraw 25% of my liquidity from Amped as ANON tokens"

- `getUserLiquidity`: Get user's current liquidity position and ALP token balance.
  - "Check my current ALP token balance in Amped"
  - "Show me my liquidity position details in Amped"

- `getPoolLiquidity`: Get current liquidity pool information and token balances.
  - "Show me the total liquidity in Amped's pools"
  - "What are the current token balances in Amped's liquidity pools?"

- `getUserTokenBalances`: Get balances and USD values of all supported tokens for a specific user.
  - "Show me all my token balances in Amped"
  - "What's the USD value of my tokens in Amped?"

### Trading Operations
- `openPosition`: Open a leveraged long or short position with specified collateral.
  - "Open a 5x long position on ANON using 100 USDC as collateral"
  - "Create a short position on WETH with 50 USDC collateral and 3x leverage"

- `closePosition`: Close one or more leveraged positions, fully or partially.
  - "Close my long ANON position in Amped"
  - "Close 50% of my short WETH position"

- `getAllOpenPositions`: Get all open positions for a specific account.
  - "Show all my open positions in Amped"
  - "List my active trading positions"

- `getPosition`: Get detailed information about a specific position.
  - "Show me details of my long ANON position"
  - "What's the current PnL on my short WETH position?"

- `marketSwap`: Execute a market swap between two tokens.
  - "Swap 100 USDC for ANON with 0.5% slippage"
  - "Exchange 50 S tokens for WETH"

### Information & Analytics
- `getPoolLiquidity`: Get total pool liquidity information including ALP supply and Assets Under Management (AUM).
  - "What's the total AUM in Amped's pools?"
  - "Show me the ALP supply and pool liquidity details"

- `getALPApr`: Calculate and retrieve the current APR for ALP tokens.
  - "What's the current APR for providing liquidity in Amped?"
  - "Show me the ALP token APR breakdown"

- `getEarnings`: Get earnings information for a user's positions and liquidity.
  - "Show my total earnings from Amped positions and liquidity"
  - "Calculate my cumulative returns in Amped"

- `getPerpsLiquidity`: Get available liquidity information for perpetual trading.
  - "What's the available liquidity for trading ANON perpetuals?"
  - "Show me the maximum position size possible for WETH longs"

- `getSwapsLiquidity`: Get information about available liquidity for token swaps.
  - "What's the available liquidity for swapping USDC to ANON?"
  - "Show me the maximum swap amounts possible between tokens"

### Rewards
- `claimRewards`: Claim any available rewards from liquidity provision or trading.
  - "Claim my pending rewards from Amped"
  - "Collect all my earned rewards from liquidity provision"

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

## Function Call Tool

The project includes a utility script to directly call any function defined in the tools.ts file. This provides an easy way to test and interact with the Amped Finance protocol without having to create separate test scripts for each function.

### Usage

```bash
npm run function -- <functionName> [parameters]
```

Parameters can be provided in two formats:

1. As JSON:
```bash
npm run function -- functionName '{"param1": "value1", "param2": 123}'
```

2. As key-value pairs:
```bash
npm run function -- functionName param1=value1 param2=123
```

### Examples

List all available functions:
```bash
npm run function
```

Get detailed information about a specific function:
```bash
npm run function -- getPoolLiquidity
```

Get protocol information:
```bash
npm run function -- getPoolLiquidity chainName=sonic
```

Get user token balances:
```bash
npm run function -- getUserTokenBalances chainName=sonic account=0xYourAddress
```

Check ALP APR:
```bash
npm run function -- getALPAPR chainName=sonic account=0xYourAddress tokenAddress=0xfb0e5aabfac2f946d6f45fcd4303ff721a4e3237
```

### Environment Variables

The script requires the following environment variables to be set in a .env file:

```
PRIVATE_KEY=your_private_key_without_0x_prefix
DRY_RUN=false  # Set to true to simulate transactions without execution
```

### Security Notice

- Never share your private key or commit it to version control
- Use with caution when executing functions that perform actual transactions
- Always test with small amounts first when adding or removing liquidity