# Rings

Integration with the Rings protocol


## Overview

Rings is a meta-stablecoin for USD & ETH offering competitive yield for stakers, providing deep liquidity for Sonic DeFi, and funding Sonic DeFi projects via its lockers.
Built on the Veda BoringVaults.

## Features

Key functions of Rings:
- Deposit and redeem USDC and WETH for scUSD and scETH respectively
- Stake scUSD and scETH for earning yield
- Lock stkscUSD to have voting opportunity
- Accrue points through depositing, staking and locking assets

## Supported Networks

- SONIC

## Common Tasks

1. Basic Operations
   - depositAsset
      - "Deposit 1000 USDC in @rings"
      - "Put all ETH in @rings"
   - redeemAsset
      - "Redeem 500 USDC from @rings"
      - "Withdraw all ETH from @rings"
   - cancelRedeemAsset
      - "Cancel redeem of USD from @rings"
      - "Abort ETH withdraw from @rings"
   - stakeAsset
      - "Stake 32 scETH in @rings"
      - "Stake all scUSD in @rings"
   - unstakeAsset
      - "Unstake 16 scETH from @rings"
      - "Unstake all scUSD from @rings"
   - cancelUnstakeAsset
      - "Cancel scETH unstake from @rings"
      - "Stop scUSD unstake from @rings"
   - lockAsset
      - "Lock 500 stkscUSD for 12 weeks in @rings"
      - "Lock all stkscETH for 1 week in @rings"
   - unlockAsset
      - "Unlock all stkscUSD from @rings"
      - "Unlock all stkscETH from @rings"
   - extendLock
      - "Extend veETH lock for 4 weeks in @rings"
      - "Increase veUSD lock for 52 week in @rings"
   - increaseLockedAsset
      - "Increase veUSD locked amount by 1000 in @rings"
      - "Add all veETH to lock in @rings"
   - delegateVotes
      - "Delegate all votes from veETH to 0xffdd45f075e5f757e86bb83fca7114bed9914166 in @rings"
      - "Delegate USD votes to 0xffdd45f075e5f757e86bb83fca7114bed9914166 in @rings"

2. Information Queries
   - getUserPoints
      - "Check my points in @rings"
      - "Show 0xffdd45f075e5f757e86bb83fca7114bed9914166 points in @rings"
   - getTvl
      - "Show current TVL in @rings"
      - "Check total value locked in @rings"


## Addressing Pain Points

- One of a kind meta-stablecoin on Sonic
- Deep and sticky liquidity for Sonic DeFi
- Earning yield with battle-tested strategies

## Installation

```bash
yarn add @heyanon/rings
```

