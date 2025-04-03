# Beefy Multichain Yield Optimizer

Beefy allows you to earn the highest APYs across 20+ chains with safety and efficiency in mind.

## Common Tasks

1. **Portfolio**
    - My TVL on @beefy
    - Show all my positions on @beefy
    - Value of my "Seamless USDC" position on @beefy on Base chain
    - Show APR of all my positions on @beefy

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

## Future improvements

- Implement Zap into position (requires performing the swap before depositing)
- Warn user if there are risks in the position (e.g. low liquidity, low TVL, etc.)
