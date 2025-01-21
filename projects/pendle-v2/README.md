# Pendle Finance v2 Integration

Integration with Pendle Finance v2 Protocol - a DeFi protocol for liquid staking derivatives and yield trading.

## Introduction

Pendle Finance v2 is a DeFi protocol that enables users to trade and manage yield positions through its innovative Principal Token (PT) and Yield Token (YT) system. The protocol allows users to:
- Trade future yields separately from principal
- Provide liquidity to yield trading markets
- Earn protocol rewards through vePENDLE staking
- Access yield opportunities across multiple chains

## Supported Networks

- Ethereum (1)
- BSC (56)
- Avalanche (43114)
- Arbitrum (42161)
- Optimism (10)
- Base (8453)

## Features

### Core Features
- Add/remove liquidity in various forms (single-sided, dual token)
- Swap tokens, PT, and YT
- Stake PENDLE for vePENDLE
- Claim protocol rewards
- Cross-chain messaging and operations

### Key Capabilities
- Automated slippage protection
- Gas-optimized transactions
- Real-time market data access
- Advanced order types support
- Comprehensive reward tracking

## Example Tasks

1. Basic Liquidity Operations
   ```typescript
   // Add single-sided liquidity
   "Add 1000 USDC to the USDC-USDT Pendle market on Arbitrum with 1% slippage"
   Parameters:
   - Market: 0x27b1dAcd74688aF24a64BD3C9C1B143118740784
   - Amount: 1000 USDC
   - MinLpOut: 990 (accounting for 1% slippage)
   
   // Remove liquidity
   "Remove 50% of my LP tokens from the ETH-stETH market on Ethereum"
   Parameters:
   - Market: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
   - LpAmount: 50% of balance
   - MinTokenOut: Calculated based on current market price
   ```

2. Advanced Market Operations
   ```typescript
   // Dual-token liquidity addition
   "Add liquidity with 5 ETH and 5 stETH to the ETH-stETH market"
   Parameters:
   - Market: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
   - Amount1: 5 ETH
   - Amount2: 5 stETH
   - MinLpOut: Calculated with 0.5% slippage

   // Swap with specific parameters
   "Swap 1000 USDC for PT-USDC with max 0.1% price impact"
   Parameters:
   - TokenIn: USDC address
   - AmountIn: 1000e6
   - MaxPriceImpact: 0.001e18
   ```

3. Reward Management
   ```typescript
   // Claim rewards
   "Claim all my PENDLE rewards from ETH-stETH market"
   Parameters:
   - Market: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e
   - Account: User's address

   // Lock PENDLE
   "Lock 10000 PENDLE tokens for 2 years"
   Parameters:
   - Amount: 10000e18
   - LockDuration: 63072000 (2 years in seconds)
   ```

## Pain Points Solved

1. Complex Position Management
   - Simplified liquidity provision process
   - Automated reward optimization
   - One-click position adjustments
   - Clear position tracking and analytics

2. Market Analysis
   - Real-time APY calculations
   - Automated price impact checks
   - Historical yield data access
   - Market comparison tools

3. Gas Optimization
   - Batched transactions
   - Optimized approval flows
   - Smart contract interaction efficiency
   - Cross-chain operation optimization

4. Risk Management
   - Slippage protection
   - Price impact warnings
   - Liquidity depth analysis
   - Expiration tracking

## Additional Resources

### Official Documentation
- [Pendle Documentation](https://docs.pendle.finance/)
- [Technical Documentation](https://docs.pendle.finance/developers)
- [Smart Contract Reference](https://docs.pendle.finance/developers/smart-contracts)

### Development Resources
- [GitHub Repository](https://github.com/pendle-finance/pendle-core-v2)
- [SDK Documentation](https://docs.pendle.finance/developers/sdk)
- [Contract Addresses](https://docs.pendle.finance/developers/deployments)
- [Security Audits](https://docs.pendle.finance/protocol/security)

### Community & Support
- [Discord Community](https://discord.gg/pendle)
- [Governance Forum](https://forum.pendle.finance/)
- [Blog](https://medium.com/pendle)
