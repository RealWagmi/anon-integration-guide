# Gu

Gu Integration


## Overview

Gu Trade is the ultimate protocol to launch and trade your tokens and memecoins, built on top of CamelotDEX.
Anyone can create a token and take it to millions. With Gu Trade, launching your token is simple and accessible to everyone.
Tokens launched through Gu Trade can be easily bridged with LayerZero, ensuring scalability and flexibility for your project.

## Features

Key functions of Gu:
- Deploy tokens
- Buy and sell tokens that are not bonded yet
- Fetch token address with name and symbol
- Query token prices in ETH and USD
- Query token market caps in ETH and USD
- Find out the last token deployed

## Supported Networks

- ARBITRUM

## Common Tasks

1. Basic Operations
   - deployToken
      - "Launch a token called "HeyAnon" with ticker ANON, leave description blank and use "https://someurl.com" for the image with @gu"
      - "Deploy a meme called "Ether" with parameters: ETH, "Vitalik help", "https://someurl.com" with @gu"
   - buyToken
      - "Buy ANON token for 0.5 ETH on @gu"
      - "Buy ETH for all available ETH with 10% slippage on @gu"
   - sellToken
      - "Sell all the 0x3a906dcFdC8353B1bBde6a5ce7F79f02D589d3A1 tokens on @gu"
      - "Sell half of ETH on @gu"

2. Information Queries
   - getTokenAddress
      - "Show the token address for GU on @gu"
      - "Get the token address of ANON on @gu"
   - getTokenPrice
      - "Check the price of ANON on @gu"
      - "Show the ANON price on @gu"
   - getTokenMarketCap
      - "Get the market cap of ORLY on @gu"
      - "Fetch ORLY the market cap on @gu"
   - getTokenPriceInUsd
      - "Check the price of ANON in USD on @gu"
      - "Show the ANON price in dollars on @gu"
   - getTokenMarketCapInUsd
      - "Get the market cap of ORLY in USD on @gu"
      - "Fetch ORLY the market cap in dollars on @gu"
   

## Addressing Pain Points

- Simplified token deployment for any purpose
- Easy token price discovery (e.g., 4 ETH for DEX LP)

## Installation

```bash
pnpm add @heyanon/gu-project
```