# Compound V3 Protocol integration

## Overview

Compound V3 Protocol is a Tier-1 decentrilized lending and borrowing protocols. The protocol allows to decrease risk due to isolated markets. The protocols allow to lend assets such as: WETH, ETH, USDC, USDbC, USDC.e, USDT and AERO, allowing users to manage the position, get current markets statistics to choose the best yeild opportunity.

### Main Features

- Lend WETH, ETH, USDC, USDbC, USDC.e, USDT and AERO
- Query current lending and borrowing APRs
- Get lend position on chain on specific market
- Get all lend positions on chain

## Supported Networks

- ETHEREUM
- ARBITRUM
- BASE

## Common Tasks

1. Lend Operations

    - "Lend 1000 USDT in @compound-v3 on Ethereum network"
    - "Add the whole AERO liqudity in @compound-v3 on Base network"
    - "Deposit 1000 USDC tokens in @compound-v3 on Arbitrum"
    - "Lend 10 native tokens in @compound-v3 on Base"
    - "Deposit 222 USDS in @compound-v3"

2. APR Queries

    - "Get lend APR for USDC on Ethereum in @compound-v3"
    - "What is the borrow APR on Base for WETH in @compound-v3"
    - "View supply APR for wstETH from Compound V3"
    - "Check borrow APR for AERO on base on Compound"

3. Position Queries
    - "Get lend position for USDT on Ethereum in @compound-v3"
    - "Show all lend position on Arbitrum in @compound-v3"

## Pain Points Solved

1. **Handle all lending flows**

    - Handle ETH to WETH wrapping on all supported chains
    - Allow lend USDT on Ethereum even with approvale more then 0
    - Support of all lend assets accross all supproted networks

2. **APR managment**

    - The support of all lend APR metrics
    - The support of all borrow APR metrics
    - Real-time APRs

3. **Position managment**
    - Receive lend position for specific market
    - Receive lend positions for specific market

## Installation

```bash
yarn add @heyanon/compound-v3
```
