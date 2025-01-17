# flatcoin

Integration with Flatcoin - ETH-backed stablecoin protocol

## Supported Networks

- BASE

## Core Contracts (Base)
- FlatcoinVault: `0x95Fa1ddc9a78273f795e67AbE8f1Cd2Cd39831fF`
  - Holds rETH deposits and manages protocol liquidity
- LeverageModule: `0xdB0Cd65dcc7fE07003cE1201f91E1F966fA95768`
  - Handles leverage position NFTs and position management
- StableModule: `0xb95fB324b8A2fAF8ec4f76e3dF46C718402736e2`
  - UNIT token contract
- DelayedOrder: `0x6D857e9D24a7566bB72a3FB0847A3E0e4E1c2879`
  - Manages order execution and delays
- OracleModule: `0xAba633927BD8622FBBDd35D291A914c2fDAaE1Ff`
  - Provides rETH price feeds using Pyth and Chainlink

## Key Parameters
- Trading Fee: 0.08%
- Withdrawal Fee: 0.25%
- Price Impact Tolerance: 0.25%
- Available Leverage: 2x, 5x, 10x, 15x, 25x
- Maximum Long Open Interest: 120% of UNIT collateral

## Common Tasks

1. Basic Operations
   - "Execute example operation with 100 USDT in @flatcoin on Ethereum network"
   - "Run example transaction with 50 USDC in @flatcoin"
   - "Perform example action with 1000 tokens in @flatcoin"

2. Information Queries
   - "Show my current status in @flatcoin"
   - "Check my balance in @flatcoin"
   - "Get example statistics from @flatcoin"
   - "Calculate expected results for my position in @flatcoin"


## Available Functions

1. UNIT Operations
   - `mintUnit`: Deposit rETH to mint UNIT tokens
   - `redeemUnit`: Redeem UNIT for underlying rETH

2. Leverage Trading
   - `openLongPosition`: Open leveraged rETH position
   - `closePosition`: Close existing position
   - `addCollateral`: Add margin to position

## Installation

```bash
yarn add @heyanon/flatcoin
```

## Usage

1. UNIT LP Operations
   - "Deposit 1 rETH to mint UNIT tokens on Base"
   - "Mint UNIT with 0.5 rETH at 0.25% slippage"
   - "Redeem 100 UNIT tokens for rETH"
   - "Check my current UNIT balance"
   - "View my earnings from trading fees and staking"

2. Leverage Trading
   - "Open a 10x leveraged long position with 0.5 rETH as collateral"
   - "Add 0.2 rETH collateral to position #123"
   - "Close my leveraged position #456"
   - "Check liquidation price for my position"
   - "View all my open positions"

3. Market Information
   - "Show current borrow rate"
   - "Get UNIT price in USD"
   - "Check total rETH in liquidity pool"
   - "Display current market skew"
   - "Calculate expected returns at current rates"

4. Portfolio Management
   - "Show my total value locked in Flatcoin"
   - "Display my position health"
   - "Calculate my current profit/loss"
   - "View my transaction history"
   - "Check my accumulated fees and rewards"

## Pain Points Solved

1. Complex Delta-Neutral Strategy Automation
   - Automatically maintains delta-neutral positions
   - Handles rebalancing without user intervention
   - Manages fee collection and distribution

2. Simplified Leverage Trading
   - One-click position opening
   - Automatic collateral management
   - Clear liquidation indicators

3. Yield Optimization
   - Combines multiple yield sources
   - Automates fee collection
   - Optimizes staking returns

4. Risk Management
   - Real-time position monitoring
   - Automated liquidation protection
   - Clear risk metrics