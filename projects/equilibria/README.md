# Equilibria Protocol

Equilibria Protocol is a yield optimization platform built on top of Pendle, enabling users to maximize their returns through automated strategies and liquidity provision. The protocol allows users to deposit Pendle LP tokens and earn additional rewards through optimized yield farming strategies.

## Supported Networks

- ETHEREUM
- ARBITRUM
- BNB
- BASE
- MANTLE
- OPTIMISM

## Common Tasks

1. LP Token Management
   - "Deposit 1000 Pendle-ETH LP tokens to @equilibria pool 5"
   - "Stake my LP tokens in @equilibria with auto-compound"
   - "Check my staked LP balance in @equilibria pool 3"
   - "View all my active positions in @equilibria"
   - "Get current APY for pool 2 in @equilibria"

2. Deposit Operations
   - "Deposit 500 Pendle-USDC LP to @equilibria on Arbitrum"
   - "Add liquidity to @equilibria pool 1 with auto-staking"
   - "Supply LP tokens to @equilibria without staking"
   - "Deposit my Pendle LP to @equilibria pool 4 and stake"
   - "Show deposit confirmation for my last transaction in @equilibria"

3. Withdrawal Management
   - "Withdraw 200 LP tokens from @equilibria pool 2"
   - "Remove all my liquidity from @equilibria pool 3"
   - "Unstake and withdraw from @equilibria"
   - "Exit position in @equilibria pool 1"
   - "Process partial withdrawal from @equilibria"

4. Reward & Yield Tracking
   - "Calculate my pending rewards in @equilibria"
   - "Show total yield earned in @equilibria"
   - "Check reward rates for pool 5 in @equilibria"
   - "View my reward history in @equilibria"
   - "Get estimated weekly returns in @equilibria"

## Pain Points Solved

1. **Complex DeFi Interactions**
   - Automated approval process for token deposits
   - Simplified one-click deposit and stake operations
   - Streamlined withdrawal process
   - Intuitive interface for complex yield strategies

2. **Portfolio Management**
   - Real-time position tracking across multiple pools
   - Automated reward calculations and distributions
   - Clear visibility of staked and unstaked positions
   - Easy monitoring of yield performance

3. **Risk Management**
   - Transparent pool information and statistics
   - Clear display of impermanent loss exposure
   - Real-time APY/APR calculations
   - Historical performance data

4. **Multi-chain Complexity**
   - Unified interface across all supported networks
   - Seamless cross-chain position management
   - Consistent user experience across chains
   - Simplified network switching

## Available Functions

1. `depositLP`
   ```typescript
   await depositLP({
       chainName: 'ARBITRUM',
       account: '0x...',
       poolId: 1,
       amount: '1000',
       lpTokenAddress: '0x...',
       stake: true
   });
   ```

2. `withdrawLP`
   ```typescript
   await withdrawLP({
       chainName: 'ARBITRUM',
       account: '0x...',
       poolId: 1,
       amount: '500'
   });
   ```

## Installation

```bash
yarn add @heyanon/equilibria
```

## Quick Start

```typescript
import { depositLP, withdrawLP } from '@heyanon/equilibria';

// Deposit and stake LP tokens
const depositResult = await depositLP({
    chainName: 'ARBITRUM',
    account: userAddress,
    poolId: 1,
    amount: '1000',
    lpTokenAddress: lpToken,
    stake: true
});

// Withdraw LP tokens
const withdrawResult = await withdrawLP({
    chainName: 'ARBITRUM',
    account: userAddress,
    poolId: 1,
    amount: '500'
});
``` 