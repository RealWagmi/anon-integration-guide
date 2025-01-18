# Pendle Finance v2 Integration

Integration with Pendle Finance v2 Protocol - a DeFi protocol for liquid staking derivatives and yield trading.

## Supported Networks

- Ethereum (1)
- BSC (56)
- Avalanche (43114)
- Arbitrum (42161)
- Optimism (10)
- Base (8453)

## Features

- Add/remove liquidity to Pendle markets
- Claim rewards from gauge controller
- Lock PENDLE tokens for vePENDLE
- View market information and rewards

## Common Tasks

1. Market Liquidity Operations

   - "Add 5 ETH and 5 stETH to Pendle ETH-stETH market on Ethereum with 1% slippage"
   - "Add 1000 USDC and 1000 USDT to Pendle market on Arbitrum"
   - "Remove 50% of my liquidity from Pendle ETH-stETH market on Ethereum"
   - "Exit my entire position from Pendle USDC-USDT market on Base"
   - "What's my current liquidity position in Pendle ETH-stETH market?"
   - "Calculate expected LP tokens for adding 1000 USDC to Pendle market"

2. Rewards Management

   - "Claim PENDLE rewards from my ETH-stETH market position on Ethereum"
   - "Show my unclaimed rewards across all Pendle markets"
   - "What's the current APR for providing liquidity to ETH-stETH market?"
   - "When do my market incentives expire?"
   - "Compare reward rates between different Pendle markets"
   - "How much PENDLE can I earn per week in the ETH-stETH market?"

3. Market Analysis

   - "Show TVL and volume for Pendle ETH-stETH market"
   - "Compare APYs between different Pendle markets on Arbitrum"
   - "List all active Pendle markets sorted by TVL"
   - "What's the token composition of ETH-stETH market?"
   - "Show historical APY for USDC-USDT market"
   - "When does the current market expire?"

4. vePENDLE Operations

   - "Lock 10000 PENDLE tokens for maximum duration (2 years)"
   - "Extend my current PENDLE lock by 1 year"
   - "What's my current vePENDLE voting power?"
   - "When can I unlock my vePENDLE position?"
   - "Calculate expected boost from locking 5000 PENDLE"
   - "Show my fee earnings from vePENDLE"

## Example Interactions with Parameters

```typescript
// Adding Liquidity
"Add liquidity to Pendle ETH-stETH market on Ethereum with 10 ETH and 10 stETH, minimum LP out: 19.5"

// Complex Position Management
"Remove 500 USDC worth of liquidity from Pendle market on Arbitrum, accept USDC only as output"

// Reward Optimization
"Show which Pendle market on Ethereum has the highest APR including both trading fees and PENDLE rewards"

// Advanced vePENDLE Strategy
"Calculate optimal lock duration for 20000 PENDLE tokens based on current market incentives"
```

## Additional Resources

### Official Documentation
- [Pendle Documentation](https://docs.pendle.finance/)
- [Pendle V2 Whitepaper](https://github.com/pendle-finance/pendle-v2-resources/tree/main/whitepapers)
- [Technical Documentation](https://docs.pendle.finance/developers)
- [Smart Contract Reference](https://docs.pendle.finance/developers/smart-contracts)

### Analytics & Tools
- [Pendle Market Analytics](https://info.pendle.finance/)
- [Pendle Yield Calculator](https://pendle.finance/calculator)
- [vePENDLE Simulator](https://pendle.finance/vependle)
- [Pendle Market Explorer](https://app.pendle.finance/markets)

### Community & Governance
- [Pendle Forum](https://forum.pendle.finance/)
- [Governance Portal](https://vote.pendle.finance/)
- [Discord Community](https://discord.gg/pendle)
- [Blog](https://medium.com/pendle)

### Development Resources
- [GitHub Repository](https://github.com/pendle-finance/pendle-core-v2)
- [SDK Documentation](https://docs.pendle.finance/developers/sdk)
- [Contract Addresses](https://docs.pendle.finance/developers/deployments)
- [Security Audits](https://docs.pendle.finance/protocol/security)

### Network Deployments
- [Ethereum Deployment](https://docs.pendle.finance/developers/deployments#ethereum-mainnet)
- [Arbitrum Deployment](https://docs.pendle.finance/developers/deployments#arbitrum)
- [Other Network Deployments](https://docs.pendle.finance/developers/deployments#other-networks)

## Pain Points Solved

1. Complex Liquidity Management
   - One-click liquidity provision for multiple tokens
   - Automatic slippage calculation and protection
   - Smart gas optimization for approvals
   - Simplified position tracking across multiple markets
   - Clear preview of expected LP tokens before transactions

2. Reward Optimization
   - Consolidated view of rewards across all positions
   - Real-time APR calculations including:
     - PENDLE emissions
     - Trading fees
     - Boost multipliers
   - Automated reward claiming across multiple markets
   - Reward schedule tracking and notifications

3. Market Analysis & Decision Making
   - Real-time market data aggregation
   - Comparative analysis between markets:
     - TVL and volume metrics
     - Historical APY trends
     - Token composition analysis
   - Expiration tracking and rollover suggestions
   - Risk assessment based on market parameters

4. vePENDLE Management
   - Optimal lock duration calculations
   - Lock extension recommendations
   - Clear visualization of:
     - Voting power
     - Fee earnings
     - Boost multipliers
   - Lock expiry management and reminders

5. Cross-chain Operations
   - Unified interface across all supported chains
   - Chain-specific gas estimations
   - Network status monitoring
   - Cross-chain market comparisons

6. Transaction Management
   - Batched transactions for gas savings
   - Clear transaction previews
   - Detailed error messages and suggestions
   - Transaction status tracking
   - Multisig support
