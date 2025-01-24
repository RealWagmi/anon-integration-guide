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
   - "Deposit 800 LBTC"
   - "Redeem 50 wstETH"
   - "Claim 10 sUSDe"
   - "Stake 100 upAVAX"
   - "Unstake 333 upAUSD"
   - "Redeem upAVAX rewards"

2. Information Queries
   - "Show current APY for LBTC on Base in Upshift"
   - "Check wstETH TVL in Upshift"
   - "Show rewards in AVAX vault in Upshift"
   - "Check current total TVL in Upshift"


## Addressing Pain Points

- Simplified User Experience - A single reference token per vault reduces complexity for users.
- The receipt token allows for use cases on secondary markets, such as Pendle.
- Multi-Chain Yield Opportunities - Vaults natively support multiple chains, allowing users to benefit from diverse DeFi yield programs without needing manual bridging.
- Security & Permissions - Strategists manage vaults but are limited by strict permissions and whitelisting controls.

## Installation

```bash
yarn add @heyanon/upshift
```
