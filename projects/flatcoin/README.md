# Flatcoin Integration

## Overview

Flatcoin is an ETH-backed stablecoin protocol on the BASE network that allows users to:
- Mint UNIT tokens by depositing rETH
- Open leveraged long positions with up to 25x leverage
- Manage positions with flexible collateral adjustments
- Earn yield through liquidity provision

The protocol operates exclusively on the BASE network and uses rETH (Rocket Pool ETH) as the collateral asset.

## Supported Networks
- BASE

## Example Tasks

1. Minting UNIT Tokens
   - "Mint UNIT tokens with 1.5 rETH"
   - "Deposit 0.5 rETH to get UNIT with 0.1% slippage"
   - "Create UNIT position using 2 rETH"

2. Redeeming UNIT Tokens
   - "Redeem 100 UNIT tokens for rETH"
   - "Withdraw 50 UNIT with minimum 0.1 rETH"
   - "Convert 75 UNIT back to rETH"

3. Leveraged Trading
   - "Open a 5x leveraged position with 2 rETH"
   - "Create 10x long position with 1 rETH margin"
   - "Start 25x leverage trade using 0.5 rETH"

4. Position Management
   - "Add 0.5 rETH collateral to position #123"
   - "Increase margin of position 456 by 1 rETH"
   - "Close position #789 with minimum price 1800"
   - "Exit position 101 from long trade"

## Pain Points Solved by Anon

1. Complex Order Management
   - Simplified order creation and execution
   - Automatic keeper fee calculation
   - Slippage protection built-in

2. Position Management
   - Easy position tracking by ID
   - Flexible collateral adjustments
   - Streamlined position closure

3. Parameter Validation
   - Automatic validation of input amounts
   - Leverage limits enforcement
   - Chain compatibility checks

4. User Experience
   - Natural language processing for commands
   - Clear error messages and guidance
   - Transaction status notifications

## Technical Details

### Key Features
- Automated keeper fee calculation
- Slippage tolerance management
- Position size and leverage validation
- Collateral management system
- Order execution monitoring

### Smart Contract Interactions
- Delayed order system for secure execution
- Leverage module for position management
- Keeper fee optimization
- Oracle price feed integration

## Examples with Real Values

1. Minting UNIT
```typescript
// Mint 1.5 UNIT with 0.25% slippage
"Mint UNIT tokens with 1.5 rETH"
```

2. Opening Leveraged Position
```typescript
// Open 5x leverage with 2 rETH margin
"Open a 5x leveraged position with 2 rETH"
```

3. Managing Positions
```typescript
// Add 0.5 rETH to position
"Add 0.5 rETH collateral to position #123"
```

4. Closing Positions
```typescript
// Close position with price protection
"Close position #456 with minimum price 1800"
```

## Error Handling

The integration provides clear error messages for common issues:
- Invalid amounts
- Unsupported leverage values
- Insufficient balance
- Chain compatibility
- Slippage tolerance violations

## Best Practices

1. Always specify slippage tolerance for minting/redeeming
2. Use position IDs for management operations
3. Set minimum fill prices when closing positions
4. Verify chain compatibility (BASE only)
5. Ensure sufficient balance for keeper fees

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