# Amped Finance AI Module Construction

## Project Overview
Create an AI agent module for Amped Finance (GMX fork) to enable automated trading and liquidity provision.

## Directory Structure
```
amped/
├── abis/
│   ├── Router.json
│   ├── Vault.json
│   ├── RewardTracker.json
│   └── PositionManager.json
├── functions/
│   ├── liquidity/
│   │   └── [liquidity functions]
│   ├── trading/
│   │   ├── swaps/
│   │   └── leverage/
│   └── index.ts
├── types/
├── tools.ts
└── index.ts
```

## Required Functions

### Liquidity Functions
1. getApr.ts
   - Use RewardTracker contract to calculate current APR
   - Include both escrowed and multiplier point rewards

2. getEarnings.ts
   - Calculate total rewards earned
   - Track both claimed and unclaimed rewards

3. addLiquidity.ts
   - Support tokens: WETH, S, wS, ANON, USDC, EURC
   - Use Router contract's addLiquidity function
   - Include slippage protection

4. removeLiquidity.ts
   - Convert ALP to any supported token
   - Use Router contract's removeLiquidity function

5. claimRewards.ts
   - Claim all available rewards
   - Use RewardTracker's claim function

### Trading Functions

#### Swaps
1. getLiquidity.ts
   - Check Vault contract for available liquidity
   - Return max possible swap amount

2. marketSwap.ts
   - Execute immediate swap
   - Include slippage protection
   - Use Router contract's swap function

3. limitSwap.ts
   - Place limit order at specified price
   - Monitor for execution conditions

#### Leverage Trading
1. getLiquidity.ts
   - Check available leverage liquidity
   - Calculate max position size

2. marketPosition.ts
   - Open/close positions at market price
   - Support 2x-11x leverage
   - Implement collateral restrictions for shorts

3. limitPosition.ts
   - Place limit orders for position entry/exit
   - Monitor price conditions
   - Support both long/short positions

## Implementation Notes
1. Error Handling
   - Implement try/catch for all contract interactions
   - Include specific error messages
   - Add fallback behavior where appropriate

2. Type Safety
   - Create interfaces for all function parameters
   - Use strict typing for contract interactions
   - Document expected return types

3. Gas Optimization
   - Batch transactions where possible
   - Implement proper error handling for failed transactions

4. Testing
   - Create unit tests for each function
   - Include integration tests for common workflows
   - Test edge cases and error conditions

## Required Contracts
- Router
- Vault
- RewardTracker
- PositionManager

## Required Dependencies
- ethers.js for contract interactions
- Required type definitions from GMX codebase

## Security Considerations
1. Input validation for all parameters
2. Slippage protection for all trades
3. Gas limit checks
4. Proper error handling for failed transactions
5. Access control for privileged operations