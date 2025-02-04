# Yelay

Yelay automatically reallocates user's liquidity among bluechip DeFi protocols in order to farm best yield

## Supported Networks

- ETHEREUM

## Common Tasks

1. Basic Operations
   - "Execute example operation with 100 USDT in @Yelay on Ethereum network"
   - "Run example transaction with 50 USDC in @Yelay"

2. Information Queries
   - "Show my current status in @Yelay"
   - "Check my balance in @Yelay"
   - "Get example statistics from @Yelay"
   - "Calculate expected results for my position in @Yelay"


## Available Functions

List of available functions will be added here.

- getUserVaultAssetBalance
- getUserVaultSvtBalance
- getVaultBaseApy
- userDepositToVault
- userFastRedeemFromVault

## Installation

```bash
yarn add @heyanon/Yelay
```

## Usage

### getUserVaultAssetBalance
Can you get me my assets balance for vault `VAULT_ADDRESS`

### getUserVaultSvtBalance
Can you get me my SVT balance for vault `VAULT_ADDRESS`

### getVaultBaseApy
Can you get the APY for vault `VAULT_ADDRESS`

### userDepositToVault
I would like to deposit `AMOUNT` `VAULT_TOKEN_SYMBOL` to vault `VAULT_ADDRESS`

### userFastRedeemFromVault
I would like to fast redeem`AMOUNT` `VAULT_TOKEN_SYMBOL` from vault `VAULT_ADDRESS`

