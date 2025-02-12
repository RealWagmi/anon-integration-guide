# Upshift

Integration with Upshift


## Overview

Upshift is a digital storefront for on-chain yield, powered by August Digital.
It offers retail users simplified access to native (“Lend”) and Partner vaults (“VaaS”).

## Features

Key functions of Upshift:
- Deposit into vaults and redeem assets
- Stake and unstake AVAX and AUSD for extra APY
- Claim rewards and deposits
- Fetch vault's APY
- Fetch vault's TVL
- Fetch vault's additional rewards

## Supported Networks

- ETHEREUM
- BASE
- AVALANCHE

## Common Tasks

1. Basic Operations
   - depositAsset
      - "Deposit 800 LBTC in Base in @upshift"
      - "Put all AVAX in Avalanche in @upshift"
   - requestRedeemAsset
      - "Redeem 50 wstETH in Ethereum from @upshift"
      - "Withdraw all sUSDe in Ethereum from @upshift"
   - claimAsset
      - "Claim all sUSDe in Ethereum from @upshift"
      - "Claim 100 ausd in Avalanche from @upshift"
   - stakeOnAvalanche
      - "Stake 100 upAVAX in @upshift"
      - "Stake all upausd in @upshift"
   - unstakeOnAvalanche
      - "Unstake 333 upAUSD from @upshift"
      - "Unstake all upAVAX from @upshift"
   - redeemRewardOnAvalanche
      - "Redeem upAVAX rewards from @upshift"
      - "Claim rewards from upAUSD from @upshift"

2. Information Queries
   - getTvl
      - "Check current TVL in @upshift"
      - "Show total value locked in @upshift"
   - getVaultApy
      - "Show current APY for LBTC on Base in @upshift"
      - "Check interest for wstETH on Ethereum in @upshift"
   - getVaultTvl
      - "Check avax TVL on Avalanche in @upshift"
      - "Show value locked in LBTC vault on Ethereum in @upshift"
   - getVaultRewards
      - "Show rewards in AVAX vault on Avalanche in @upshift"
      - "Check susde rewards on Ethereum in @upshift" 


## Addressing Pain Points

- Simplified User Experience - A single reference token per vault reduces complexity for users.
- The receipt token allows for use cases on secondary markets, such as Pendle.
- Multi-Chain Yield Opportunities - Vaults natively support multiple chains, allowing users to benefit from diverse DeFi yield programs without needing manual bridging.
- Security & Permissions - Strategists manage vaults but are limited by strict permissions and whitelisting controls.

## Installation

```bash
yarn add @heyanon/upshift
```
