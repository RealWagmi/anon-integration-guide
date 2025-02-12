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

1. UNIT Token Operations
   - "Mint UNIT tokens with 1 rETH in @flatcoin on Base"
   - "Deposit 0.5 rETH to get UNIT in @flatcoin with 0.1% slippage"
   - "Redeem 100 UNIT tokens for rETH in @flatcoin"

2. Leverage Trading
   - "Open a 5x leveraged position with 2 rETH in @flatcoin"
   - "Add 0.5 rETH collateral to position #123 in @flatcoin"
   - "Close position #456 in @flatcoin"

## Available Functions

1. UNIT Operations
   - `mintUnit`: Deposit rETH to mint UNIT tokens
     - Parameters: chainName, rethAmount, slippageTolerance (optional)
   - `redeemUnit`: Redeem UNIT for underlying rETH
     - Parameters: chainName, unitAmount, minAmountOut

2. Leverage Trading
   - `openLongPosition`: Open leveraged rETH position
     - Parameters: chainName, marginAmount, leverage (2x-25x)
   - `addCollateral`: Add margin to existing position
     - Parameters: chainName, positionId, additionalCollateral
   - `closePosition`: Close existing position
     - Parameters: chainName, positionId, minFillPrice

## Installation

```bash
yarn add @heyanon/flatcoin
```

## Usage Examples

1. Mint UNIT Tokens
```typescript
const result = await mintUnit({
    chainName: 'BASE',
    rethAmount: '1.0',
    slippageTolerance: '0.25'
});
```

2. Open Leveraged Position
```typescript
const result = await openLongPosition({
    chainName: 'BASE',
    marginAmount: '0.5',
    leverage: '10'
});
```

3. Add Collateral to Position
```typescript
const result = await addCollateral({
    chainName: 'BASE',
    positionId: '123',
    additionalCollateral: '0.2'
});
```

4. Close Position
```typescript
const result = await closePosition({
    chainName: 'BASE',
    positionId: '456',
    minFillPrice: '1800.0'
});
```

## Features

1. UNIT Token Management
   - Mint UNIT tokens with rETH collateral
   - Redeem UNIT tokens back to rETH
   - Slippage protection for trades

2. Leverage Trading
   - Multiple leverage options (2x to 25x)
   - Flexible position management
   - Collateral addition support
   - Protected position closure

3. Safety Features
   - Slippage tolerance settings
   - Minimum output validation
   - Transaction validation
   - Network verification