# camelot-v3

Camelot V3 DEX is a decentralized exchange built on the Arbitrum network, enabling users to swap tokens and manage liquidity. 
It offers a flexible Automated Market Maker (AMM) model, and supports customizable liquidity provisioning.

## Supported Networks

- ARBITRUM

## Common Tasks

1. Basic Operations
   - "Swap 100 USDT to ETH in @camelot-v3 on Arbitrum network"
   - "Swap 100 USDT to ETH in @camelot-v3 while receiving at least 0.1 ETH on Arbitrum network"
   - "Swap 100 USDT to ETH in @camelot-v3 and sent them to 0x33128fA08f5E0545f4714434b53bDb5E98F62474 on Arbitrum network"
   
   - "Swap USDT to exactly 0.1 ETH in @camelot-v3 on Arbitrum network"
   - "Swap USDT to exactly 0.1 ETH in @camelot-v3 while paying at most 100 USDT on Arbitrum network"
   - "Swap USDT to exactly 0.1 ETH in @camelot-v3 and sent them to 0x33128fA08f5E0545f4714434b53bDb5E98F62474 on Arbitrum network"
   
   - "Add 100 USDT and 0.1 ETH liquidity in @camelot-v3 on Arbitrum network"
   - "Add 100 USDT and 0.1 ETH liquidity in @camelot-v3 while providing at least 90 USDT and 0.09 ETH on Arbitrum network"
   - "Add 100 USDT and 0.1 ETH liquidity in @camelot-v3 and sent the position NFT to 0x0419959C9ffF74FEaC47e51D5869fabcA61FFF15 on Arbitrum network"
   - "Add 100 USDT and 0.1 ETH liquidity between price range 3150.12 USDT/ETH and 3793.65 USDT/ETH in @camelot-v3 on Arbitrum network"
   - "Add 100 USDT and 0.1 ETH liquidity between price range -20% and +20% from current price in @camelot-v3 on Arbitrum network"
   - "Place a limit order to swap 0.1 ETH to USDT at price 3562.93 USDT/ETH in @camelot-v3 on Arbitrum network"
   - "Place a limit order to DCA swap 0.1 ETH to USDT between price range 3150.12 USDT/ETH and 3793.65 USDT/ETH in @camelot-v3 on Arbitrum network"

   - "Increase liquidity in ETH/USDT pool by 0.1 ETH and 100 USDT in @camelot-v3 on Arbitrum network"
   - "Increase liquidity in ETH/USDT pool by 0.1 ETH and 100 USDT in @camelot-v3 while providing at least 0.09 ETH and 90 USDT on Arbitrum network"
   - "Increase liquidity in ETH/USDT pool where tokenId is 123456 by 0.1ETH and 100 USDT in @camelot-v3 on Arbitrum network"

   - "Decrease liquidity in ETH/USDT pool by 10% in @camelot-v3 on Arbitrum network"
   - "Decrease liquidity in ETH/USDT pool by 10% in @camelot-v3 while receiving at least 0.1 ETH and 100 USDT on Arbitrum network"
   - "Decrease liquidity in ETH/USDT pool where tokenId is 123456 by 10% in @camelot-v3 on Arbitrum network"

   - "Collect fees from ETH/USDT pool in @camelot-v3 on Arbitrum network"
   - "Collect fees from ETH/USDT pool and sent them to 0x33128fA08f5E0545f4714434b53bDb5E98F62474 on Arbitrum network"
   - "Collect 50% of fees from ETH/USDT pool in @camelot-v3 on Arbitrum network"
   - "Collect 0.05 ETH and 25 USDT fees from ETH/USDT pool in @camelot-v3 on Arbitrum network"
   - "Collect fees from ETH/USDT pool in @camelot-v3 where tokenId is 123456 on Arbitrum network"

2. Information Queries
   - "Get my LP position in @camelot-v3 on Arbitrum network" 
   - "Quote 100 USDT to ETH in @camelot-v3 on Arbitrum network"
   - "Quote USDT to exactly 0.1 ETH in @camelot-v3 on Arbitrum network"

## Available Functions

- **Swap**: Swap tokens on the DEX.
- **Add Liquidity**: Add liquidity to the DEX.
- **Manage Liquidity**: Increase / Decrease / Remove liquidity on the DEX.

## Installation

```bash
yarn add @heyanon/camelot-v3
```
