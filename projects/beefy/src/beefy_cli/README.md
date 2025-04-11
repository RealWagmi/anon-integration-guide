# Beefy CLI

A command-line interface for interacting with the Beefy Finance API.

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
npm run beefy-cli -- <command> [options]
```

## Available Commands

- `vaults` - Get all vaults
- `simplified-vaults` - Get all simplified vaults (which include APY and TVL)
- `apy` - Get APY breakdown for all vaults
- `tvl` - Get Total Value Locked for all vaults
- `prices` - Get token prices
- `lps` - Get liquidity pool prices
- `lps-breakdown` - Get liquidity pool breakdown
- `tokens` - Get tokens
- `config` - Get Beefy configuration
- `chains` - Get chains supported by Beefy
- `boosts` - Get Boosts
- `timeline` - Get address timeline from Databarn
- `products` - Get products by chain from Databarn

## Examples

```bash
# Get all vaults
beefy-cli vaults

# Get APY breakdown with custom timeout (in milliseconds)
beefy-cli apy

# Get products for a specific chain
beefy-cli products --chain ethereum

# Get products for a specific chain including EOL (end of life) products
beefy-cli products --chain ethereum

# Get timeline for a specific address
beefy-cli timeline --address 0x123...abc
```

## Options

Some commands have specific required options:

- `timeline` requires `-a, --address <address>` - Investor address
- `products` requires `-c, --chain <chain>` - Chain name
