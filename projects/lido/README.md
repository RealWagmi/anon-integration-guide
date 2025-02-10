# **Lido Protocol - Liquid Staking for Ethereum**

## **Overview**

Lido is a decentralized liquid staking protocol for Ethereum that allows users to stake ETH while maintaining liquidity. By staking ETH through Lido, users receive **stETH**, a liquid staking token, in return. stETH can be used across DeFi platforms while continuing to earn staking rewards.

## **What Lido Protocol Can Do for You**

- **Liquid Staking**: Stake ETH and receive stETH, a liquid staking token.
- **Withdrawals**: Unstake stETH to retrieve ETH, including accumulated rewards.
- **DeFi Compatibility**: Utilize stETH in DeFi protocols without waiting for Ethereum withdrawals.
- **Real-time Rewards**: Earn staking rewards that are reflected in your stETH balance.
- **Wrapped Staking**: Convert stETH to **wstETH**, a non-rebasing token for DeFi protocols.

## **Supported Networks**

- **Ethereum**: Stake ETH and receive stETH for liquidity and DeFi strategies.

## **Common Tasks**

### **Staking ETH**

- Stake ETH and receive stETH:
  - "Stake 1 ETH in Lido."
  - "Stake half of my ETH in Lido."
  - "Show my stETH balance."

### **Unstaking & Withdrawals**

- Unstake stETH to retrieve ETH:
  - "Unstake 2 stETH from Lido."
  - "Unstake all my stETH from Lido."
  - "Withdraw ETH from my stETH balance."

### **Wrapping & Unwrapping**

- Convert stETH to wstETH and back:
  - "Wrap 1 stETH into wstETH."
  - "Unwrap 2 wstETH back to stETH."

### **Checking Rewards & APR**

- Retrieve staking details and rewards:
  - "Check my staking rewards."
  - "Get my average APR in Lido."
  - "Calculate total rewards earned."

## **Available Functions**

| Function                | Description                                             |
| ----------------------- | ------------------------------------------------------- |
| `stakeETH`              | Stake ETH through Lido and receive stETH                |
| `wrapStETH`             | Convert stETH into wstETH                               |
| `unwrapWstETH`          | Convert wstETH back into stETH                          |
| `getStETHBalance`       | Retrieve stETH balance for a specific account           |
| `getWstETHBalance`      | Retrieve wstETH balance for a specific account          |
| `requestWithdrawStETH`  | Request a withdrawal of stETH back to ETH               |
| `claimWithdrawStETH`    | Claim a pending withdrawal of ETH                       |
| `getWstETHByStETH`      | Calculate the amount of wstETH for a given stETH amount |
| `getStETHByWstETH`      | Calculate the amount of stETH for a given wstETH amount |
| `getTotalStaked`        | Retrieve the total staked ETH in Lido                   |
| `getTotalRewardsEarned` | Calculate total rewards earned from stETH staking       |
| `getLidoAPR`            | Fetches the latest Lido APR from the official Lido API  |

## **Installation**

To install Lido’s protocol package, run the following:

```bash
yarn add @heyanon/lido
```
