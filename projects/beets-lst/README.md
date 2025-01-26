# Beets LST - Liquid staking on Sonic

Beets LST allows you to access Sonic staking rewards while maintaining full liquidity of your assets. Maximize your DeFi potential: stS tokens are always liquid and composable, allowing you to earn staking rewards while simultaneously participating in lending markets, liquidity pools, and other DeFi opportunities. Your rewards never stop - even while your assets are put to work across the ecosystem.

## What Beets LST can do for you

- **Flexible Staking & Unstaking**: Easily convert between Sonic (S) and staked Sonic (stS) tokens. Unstaking initiates a 14-day cooldown period, after which tokens can be withdrawn.

- **Liquid Staking Tokens**: Receive stS tokens that represent your staked position, which remain fully liquid and can be used across DeFi while earning staking rewards.

- **Safe and decentralized**: Your staked assets are automatically distributed across carefully selected validators, providing enhanced decentralization and risk management.

- **Real-time Exchange Rates**: Track the value of your staked positions with accurate exchange rates between S and stS tokens, which reflect your accrued staking rewards.

- **Streamlined Withdrawals**: Manage multiple withdrawal requests efficiently, with the ability to track pending withdrawals and withdraw all available tokens in a single transaction once the cooldown period completes.

## Supported Networks

- SONIC

## Common Tasks

- **Staking**
    - "Stake 100 S in @beets-lst"
    - "Stake half of my Sonic in @beets-lst"
    - "How many stS do I have in @beets-lst?"
    - "Show my position in @beets-lst"
- **Unstaking**
    - "Unstake 100 stS from @beets-lst"
    - "Unstake all of my stS from @beets-lst"
    - "Unstake 100 S worth of stS from @beets-lst"
- **Withdrawing**
    - "Withdraw <withdraw_id> from @beets-lst"
    - "Withdraw all from @beets-lst"
    - "How long before I can withdraw from @beets-lst?"
    - "Show my open withdrawals from @beets-lst"
- **Info and alerts**
    - "Alert me when my withdrawal is ready @beets-lst"
    - "How much is worth 1 stS in @beets-lst?"
    - "How much is worth 1 S in @beets-lst?"
    - "How much Sonic is in the protocol @beets-lst?"

## Available Functions

- [stake](functions/stake.ts)
- [unStake](functions/unStake.ts)
- [withdraw](functions/withdraw.ts)
- [withdrawAll](functions/withdrawAll.ts)
- [getSonicBalance](functions/getSonicBalance.ts)
- [getStakedSonicBalance](functions/getStakedSonicBalance.ts)
- [getOpenWithdrawRequests](functions/getOpenWithdrawRequests.ts)
- [getProtocolSonicToStakedSonicExchangeRate](functions/getProtocolSonicToStakedSonicExchangeRate.ts)
- [getProtocolStakedSonicToSonicExchangeRate](functions/getProtocolStakedSonicToSonicExchangeRate.ts)
- [getTotalSonicInProtocol](functions/getTotalSonicInProtocol.ts)
- [getTotalStakedSonicInProtocol](functions/getTotalStakedSonicInProtocol.ts)

## Installation

```bash
yarn add @heyanon/beets-lst
```

## Usage

Example usage will be added here.

## Contracts and transactions

- Liquid staking proxy contract: https://sonicscan.org/address/0xe5da20f15420ad15de0fa650600afc998bbe3955
- Liquid staking implementation contract: https://sonicscan.org/address/0xd5f7fc8ba92756a34693baa386edcc8dd5b3f141
- Liquid staking helper contract: https://sonicscan.org/address/0x52b16e3d7d25ba64f242e59f9a74799ecc432d78
- Stake Sonic TX (`deposit`): https://sonicscan.org/tx/0x19545670b77c9ab7e1eabdab292c1aa9d0abd6e11777ab3147f343cb900c728b
- Initiate unstake TX (`undelegateMany`): https://sonicscan.org/tx/0xb64c4fd6ae4667a3b7ce9d6ba9679fbd2c591173a0895a5616adc3b039b10c27
- Withdraw Sonic TX (`withdraw`): https://sonicscan.org/tx/0xb93b07384ccbace4236d07fac46874039821c84707f69fbee101e9ae5506f470

## Test with the askBeets agent

I've built a simple agent called `askBeets` to test the integration. To run it, you need to configure .env:

```bash
cd projects/beets-lst
yarn install
cp .env.example .env
# insert test wallet private key into .env
# insert OpenAI API key into .env
```

and then you can ask questions directly:

```bash
yarn run ask "Stake 0.1 S and show my staked balance"
yarn run ask "Unstake all of my stS"
yarn run ask "How long before I can withdraw?"
```

The agent will perform one or more tasks to execute your request; see for example this GIF where I asked to bot to unstake all of my stS:

https://github.com/user-attachments/assets/2ce0d109-85b5-4548-8bad-2c4bfadaeacf

To debug the actual OpenAI responses, run `askBeets` with `--verbose` flag:

```bash
yarn run ask "What is my stS balance?" --verbose
```
