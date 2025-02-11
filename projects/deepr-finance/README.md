# Deepr Finance

Integration with Deepr Finance


## Overview

Deepr Finance enables users to lend and borrow digital assets without the need for intermediaries on IOTA EVM.
Users can supply their assets to the platform, earning interest on their deposits, while borrowers can take out loans by providing collateral.

## Features

Key functions of Deepr Finance:
- Lend and withdraw assets
- Enable and disable assets as collateral
- Borrow and repay assets
- Gain extra interest in DEEPR tokens
- Stake and unstake DEEPR tokens
- Fetch Deepr Finance TVL
- Fetch user's health factor and market activity
- Fetch supply, borrow and stake rates
- Fetch close factor

## Supported Networks

- IOTA

## Common Tasks

1. Basic Operations
   - enableAssetAsCollateral
      - "Enable WETH as collateral in @deepr"
      - "Enable every market as collateral in @deepr"
   - disableAssetAsCollateral
      - "Disable USDC as collateral in @deepr"
      - "Disable every market as collateral in @deepr"
   - lendAsset
      - "Lend 1 WETH to @deepr"
      - "Lend all available USDC to @deepr"
   - borrowAsset
      - "Borrow 500 USDC from @deepr"
      - "Borrow maximum amout of IOTA from @deepr"
   - withdrawAsset
      - "Withdraw 0.5 WIOTA from @deepr"
      - "Withdraw all assets from @deepr"
   - repayAsset
      - "Repay 500 USDC to @deepr"
      - "Repay all available WETH in my wallet to @deepr"
   - claimDeepr
      - "Claim DEEPR in @deepr"
   - stakeDeepr
      - "Stake 10000 DEEPR in @deepr"
      - "Stake all DEEPR in @deepr"
   - requestUnstakeDeepr
      - "Unstake 888 DEEPR from @deepr"
      - "Make a request to unstake all DEEPR from @deepr"
   - withdrawLockedDeepr
      - "Withdraw 777 DEEPR from @deepr"
      - "Withdraw all DEEPR from @deepr staking"

2. Information Queries
   - getCloseFactor
      - "Check close factor in @deepr"
      - "What's close factor for @deepr"
   - getMarketBorrowRate
      - "Show borrow rate of WETH in @deepr"
      - "Check WIOTA borrow interest in @deepr"
   - getMarketSupplyRate
      - "Show supply rate of USDC in @deepr"
      - "What's WETH supply interest in @deepr"
   - getStakeDeeprApr
      - "Check DEEPR staking rate in @deepr"
      - "Show the interest for staking DEEPR in @deepr"
   - getTvl
      - "Fetch TVL of @deepr"
      - "Check total value locked in @deepr"
   - getUsersHealthFactor
      - "Check my health factor in @deepr"
   - getUsersMarketPosition
      - "Show my market data for WETH in @deepr"
      - "Check how much WETH I supplied to @deepr"
      - "Check how much USDC I borrowed from @deepr"


## Addressing Pain Points

- The biggest lending on IOTA EVM, which holds 1/3 of it's TVL
- Earn interest supplying assets and borrow against them
- Earn extra interest with protocol's token DEEPR

## Installation

```bash
yarn add @heyanon/deepr-finance
```
