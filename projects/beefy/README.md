# Beefy Multichain Yield Optimizer

Beefy allows you to earn the highest APYs across 20+ chains with safety and efficiency in mind.

## Common Tasks

1. **Portfolio**
    - Show all my positions on @beefy
    - My TVL on @beefy
    - Value of my Seamless USDC position on Base chain on @beefy
    - Show APY of all my positions on @beefy
2. **Yields & Vaults**
    - Best yield for USDC on @beefy?
    - Best yield for USDC on @beefy, without the need to LP?
    - Show pools with wETH on @beefy
    - Give me info on @beefy vault 'Boosted Stable Rings'
3. **Deposits & Withdrawals**
    - Deposit 100 USDC on vault Seamless USDC on Base chain

## Available Functions

- `getMyPositionsPortfolio`: Show the vault positions in the user portfolio. For each position, show the tokens in the pool, the type of pool, the amounts of tokens, the APR yield, and the dollar value of the position.

## Installation

```bash
pnpm add @heyanon/beefy
```

## Test with the askBeefy agent

I've built a simple agent called `askBeefy` to test the integration. To run it, you need to configure .env:

```bash
cd projects/beefy
pnpm install
cp .env.example .env
# insert test wallet private key into .env
# insert OpenAI or DeepSeek key into .env
```

and then you can ask questions directly:

```bash
pnpm ask "What can I do on Beefy?"
pnpm ask "Deposit 100 USDC on vault Seamless USDC on Base chain"
pnpm ask "Remove half of my liquidity from vault Seamless USDC on Base chain"
```

Options:

- `--debug-llm`: Show the actual LLM responses
- `--debug-tools`: Show the output of every tool call

## To do

- Prevent conflict between `getVaultInfoFromVaultName` and `getVaultInfoFromVaultId` (e.g. "Deposit 0.01 USDC.e in vault 'aavev3-sonic-usdc.e'" search for name instead than id)
- Find best ux to allow user to deposit and withdraw LPs... names are hard, maybe with a resolver?
- Make sure that deposit and withdrawals tools use `getVaultInfoFromVaultName` to get the vault info
- If the user does not have LP tokens, show them the `addLiquidityUrl` link
- Handle timeline endpoint delay

## Future improvements

- Implement Zap into position; requires performing the swap before depositing. [Not sure it is even recommended to do so](https://discord.com/channels/755231190134554696/758368074968858645/1304065221916098610).
- Warn user if there are risks in the position (e.g. low liquidity, low TVL, etc.)
- Include Beefy Boost into APY computation ([link](https://app.beefy.com/vault/beetsv3-sonic-beefyusdce-scusd) | [screen](https://d.pr/i/5NPz9B))

## KB

- [How to get current mooTokens balance](https://discord.com/channels/755231190134554696/758368074968858645/1304062150913949747)
- [Deposit flow](https://discord.com/channels/755231190134554696/758368074968858645/1305213585286500352)
