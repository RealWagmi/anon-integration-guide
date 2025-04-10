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
    - Deposit 50% in @beefy vault "Seamless USDC" on Base chain
    - Withdraw 50% from @beefy vault "Seamless USDC" on Base chain
    - Withdraw all from @beefy vault "Seamless USDC" on Base chain
4. **Help**
    - What can I do on @beefy?

## Best Practices

For best results, use Vault IDs (beets-sonic-silo-super-sonic) instead of vault names (Silo Super Sonic). Vault IDs are returned by all vault-related queries, e.g. `Show me all my positions on @beefy` or `Show me best yield opportunities for USDC on @beefy`.

Vault IDs can also be found by clicking on a vault in the Beefy website, and looking at the URL: `https://app.beefy.com/vault/<VAULT ID>`.

## Available Functions

- `depositExactTokens`: Deposit an exact amount of tokens into a vault.
- `depositFractionOfTokens`: Deposit a percentage of the user's tokens into a vault.
- `depositDollarAmount`: Deposit the given amount of US dollars ($) in the given vault. The dollar value is converted to an amount of tokens to deposit, based on the current price of the vault token.
- `withdraw`: Withdraw a percentage of the user's deposited tokens from a vault. Omit the removal percentage to withdraw all of the user's tokens.
- `getMyPositionsPortfolio`: Show the top 10 vaults in the user portfolio. For each vault, show the tokens in the vault, the type of vault, the APY yield, and the dollar value of the user position in the vault.
- `getBestApyForToken`: Show the top 10 vaults with the best APY yield for the given token, sorted by APY. By default, vaults where the token is part of a liquidity pool will be included, too.
- `findVault`: Get information about a specific vault by either its ID or its name. The result will include info on any user positions in the vault.
- `getBeefyCapabilities`: Get information about what Beefy can do and example prompts.

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
pnpm ask-beefy "What can I do on Beefy?" --chain sonic
pnpm ask-beefy "Deposit \$100 into vault USDC.e (wS Market)" --chain sonic
pnpm ask-beefy "Remove half of my liquidity from vault USDC.e (wS Market)" --chain sonic
```

Options:

- `--debug-llm`: Show the actual LLM responses
- `--debug-tools`: Show the output of every tool call

## Beefy CLI

This is a simple CLI to interact with Beefy, to test the various helpers, without having to go through the LLM.

To use the CLI just run commands like:

```bash
pnpm run beefy-cli timeline --address <address>
pnpm run beefy-cli user-vaults --chain sonic --address <address>
pnpm run beefy-cli vault --chain base --id morpho-seamless-usdc
```

and so on. For a complete list of commands, see the [./src/beefy_cli folder](src/beefy_cli).

## Beefy API client

[Beefy API endpoints](https://docs.beefy.finance/developer-documentation/beefy-api) are used extensively by this integration. The Beefy API client can be found in the [./src/helpers/beefyClient.ts](src/helpers/beefyClient.ts) file. I wrote Typescript interfaces for the output of all endpoints... but I might have missed some details, like optional fields vs required ones.

## Future improvements

- Warn user if there are risks in the position (e.g. low liquidity, low TVL, etc.)
- Handle timeline endpoint delay by fetching all of the mooTokens balances from the API
- Include Beefy Boost into APY computation ([link](https://app.beefy.com/vault/beetsv3-sonic-beefyusdce-scusd) | [screen](https://d.pr/i/5NPz9B))
- Merge related products in timeline: vaults, boosts and reward pools of the same bundle of products ([discord](https://discord.com/channels/755231190134554696/758368074968858645/1357402647430299750))
- Implement Zap into position; requires performing the swap before depositing. [Not easy](https://discord.com/channels/755231190134554696/758368074968858645/1304065221916098610) or even [almost impossible](https://discord.com/channels/755231190134554696/758368074968858645/1359081924039151616).

## KB

- [How to get current mooTokens balance](https://discord.com/channels/755231190134554696/758368074968858645/1304062150913949747)
- [Deposit flow](https://discord.com/channels/755231190134554696/758368074968858645/1305213585286500352)
