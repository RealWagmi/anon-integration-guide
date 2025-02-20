# Venus Protocol Integration

## Overview

Venus Protocol is a decentralized lending and borrowing protocol that enables users to supply and borrow assets. 

### Main Features
- Supply assets to Core and DeFi pools
- Borrow assets from pools
- Repay borrowed positions (partial or full)
- Withdraw supplied assets
- Enable/Disable collateral (Enter/Exit markets)
- Query account information:
  - Current supplied amounts
  - Current borrowed amounts
  - Account liquidity
  - Available collateral
  - Maximum withdrawal amounts
- Check borrowing rates and APRs
- Manage XVS token (protocol's governance token)

### Supported Networks
- BSC
- ETHEREUM
- BASE

### Pools
Venus Protocol has two main pools:
- Core Pool - Main lending/borrowing pool
- DeFi Pool - Separate pool with different assets and rates

### Example Operations
1. Supply Operations:
   - Supply BNB to Core pool
   - Supply USDT to Core/DeFi pool
   - Supply LINK to Core pool
   - Supply USDC to Core pool

2. Collateral Management:
   - Enable token as collateral in Core pool
   - Enable token as collateral in DeFi pool
   - Exit market (disable collateral)

3. Borrowing:
   - Borrow USDT from Core pool
   - Borrow USDC from DeFi pool
   - Check borrowing rates
   - Check debt amounts

4. Repayment:
   - Full repayment
   - Partial repayment

5. Query Functions:
   - Check supplied balances
   - View enabled collaterals
   - Check account liquidity
   - View available supply tokens
   - Calculate maximum withdrawal amounts

### XVS Token Features
1. Staking:
   - Stake XVS tokens to earn rewards
   - Check staking position and pending rewards
   - Claim staking rewards

2. Unstaking:
   - Request XVS withdrawal (starts lock period)
   - Check available withdrawals
   - Claim unstaked tokens after lock period

3. Rewards Management:
   - Monitor staked balance
   - Track pending rewards
   - Claim earned rewards (paid in XVS)