# Beefy Multichain Yield Optimizer

Beefy allows you to earn the highest APYs across 20+ chains with safety and efficiency in mind.

## Common Tasks

1. **Portfolio**
    - Show all my positions on @beefy
    - My TVL on @beefy
    - Value of my "Seamless USDC" position on Base chain on @beefy
    - Show APY of all my positions on @beefy
2. **Yields & Vaults**
    - Best yield for USDC on @beefy?
    - Best yield for USDC on @beefy, without the need to LP?
    - Show pools with wETH on @beefy
    - Give me info on @beefy vault "Boosted Stable Rings"
3. **Deposits & Withdrawals**
    - Deposit $500 in @beefy vault Silo Super Sonic on Sonic chain
    - Deposit all in @beefy vault "Boosted Stable Rings" on Sonic chain
    - Deposit 50% of my USDC in @beefy vault "Seamless USDC" on Base chain
    - Withdraw 50% from @beefy vault "Seamless USDC" on Base chain
    - Withdraw all from @beefy vault "Seamless USDC" on Base chain

## Available Functions

- `depositExactTokens`: Deposit an exact amount of tokens into a vault.
- `depositDollarAmount`: Deposit the given amount of US dollars ($) in the given vault. The dollar value is converted to an amount of tokens to deposit, based on the current price of the vault token.
- `getMyPositionsPortfolio`: Show the top 10 vaults in the user portfolio. For each vault, show the tokens in the vault, the type of vault, the APY yield, and the dollar value of the user position in the vault.
- `getBestApyForToken`: Show the top 10 vaults with the best APY yield for the given token, sorted by APY. By default, vaults where the token is part of a liquidity pool will be included, too.
- `findVault`: Get information about a specific vault by either its ID or its name. The result will include info on any user positions in the vault.

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
pnpm ask "Deposit 100 USDC on vault Seamless USDC" --chain base
pnpm ask "Remove half of my liquidity from vault Seamless USDC" --chain base
```

Options:

- `--debug-llm`: Show the actual LLM responses
- `--debug-tools`: Show the output of every tool call

## To do

- Handle timeline endpoint delay
- Allow depositing by percentage, without specifying the token, e.g. "Deposit half of my tokens in vault Sonic Quartet Audition - Act II"
- Fix "Withdraw all from vault xxx"

## Future improvements

- Implement Zap into position; requires performing the swap before depositing. [Not sure it is even recommended to do so](https://discord.com/channels/755231190134554696/758368074968858645/1304065221916098610).
- Warn user if there are risks in the position (e.g. low liquidity, low TVL, etc.)
- Include Beefy Boost into APY computation ([link](https://app.beefy.com/vault/beetsv3-sonic-beefyusdce-scusd) | [screen](https://d.pr/i/5NPz9B))
- Related to the above: Merge related products in timeline: vaults, boosts and reward pools of the same bundle of products ([discord](https://discord.com/channels/755231190134554696/758368074968858645/1357402647430299750))

## KB

- [How to get current mooTokens balance](https://discord.com/channels/755231190134554696/758368074968858645/1304062150913949747)
- [Deposit flow](https://discord.com/channels/755231190134554696/758368074968858645/1305213585286500352)
