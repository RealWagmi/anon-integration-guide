# Pendle Finance Yield Trading

Pendle Finance allows you to separate interest bearing assets such as Lido's stETH and Ethena's sUSDe into two components: a principal token (PT) with a fixed interest rate and a yield token (YT) with a variable interest rate. You can then trade the PT and YT separately, for example with the purpose of betting on the expected yield from the underlying asset.

More information on Pendle Finance can be found on their own academy page: https://app.pendle.finance/trade/education

## Examples of commands

### Portfolio dashboard

    - Show all my positions on Pendle
    - Show all positions of wallet 0x5e014aa0649102e07c074f498845f01bcd520317 on Pendle
    - My total TVL on Pendle
    - Show my YTs on Pendle
    - Show my pools on Pendle
    - Value of my stETH position on Base chain on Pendle

### Available markets

    - Show Ethereum pools with highest APY on Pendle
    - Show best pools to LP USDe on Ethereum on Pendle
    - [TODO] Best fixed yield available on Ethereum on Pendle?
    - [TODO] Give me info on Pendle sUSDe pool on Ethereum
    - [TODO] List markets with highest implied APY vs underlying asset on Pendle
    - [TODO] Show me all sUSDe markets on Pendle

### Mint & redeem

    - [TODO] Mint PT and YT from my sUSDe on Ethereum on Pendle
    - [TODO] Convert my sUSDe on Ethereum on Pendle (same as above)
    - [TODO] Redeem my stETH PT and YT on Ethereum on Pendle

### Swap PT & YT

    - [TODO] Swap 1 ETH to stETH PT on Ethereum on Pendle
    - [TODO] Swap 1 ETH to stETH YT on Ethereum on Pendle
    - [TODO] Provide 1 ETH of liquidity to stETH pool on Ethereum on Pendle
    - [TODO] Zap 1 ETH to stETH pool on Ethereum on Pendle (same as above)
    - [TODO] Swap 1 stETH-PT to USDC on Ethereum on Pendle
    - [TODO] Remove my liquidity from stETH pool to ETH on Ethereum on Pendle

## Rewards

    - [TODO] Show my claimable rewards on Pendle
    - [TODO] Claim all my rewards across chains on Pendle
    - [TODO] Claim rewards for the sUSDe Ethereum market on Pendle

### Help

    - [TODO] What can I do on Pendle?

## Test with the local agent

I've built a simple agent called `ask-pendle` to test the integration. To run it, you need to configure .env:

```bash
cd projects/pendle
pnpm install
cp .env.example .env
# insert test wallet private key into .env
# insert OpenAI or DeepSeek key into .env
```

and then you can ask questions directly:

```bash
pnpm ask-pendle "What can I do on Pendle?"
pnpm ask-pendle "LP 1000 USDC into pool sUSDCe on Ethereum"
pnpm ask-pendle "Remove half of my liquidity from pool sUSDCe to ETH on Ethereum"
```

Options:

- `--debug-llm`: Show the actual LLM responses
- `--debug-tools`: Show the output of every tool call

## Useful links

- [Pendle V2 API docs](https://docs.pendle.finance/Developers/Backend/BackendAndHostedSDK)
- [Pendle V2 API reference](https://api-v2.pendle.finance/core/docs#/)
- [Pendle V2 API examples](https://github.com/pendle-finance/pendle-examples-public/tree/main)
