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

1. **Staking**
    - Stake 100 S in @beets-lst
    - Stake half of my Sonic in @beets-lst
    - How much do I have staked in @beets-lst?
    - Show my position in @beets-lst
1. **Unstaking**
    - Unstake 100 stS from @beets-lst
    - Unstake half of my stS from @beets-lst
    - Unstake all from @beets-lst
1. **Withdrawing**
    - Withdraw all from @beets-lst
    - Withdraw <withdraw_id> from @beets-lst
    - How long before I can withdraw from @beets-lst?
    - Show my pending withdrawals on @beets-lst
1. **Info and alerts**
    - What is the APR of staking Sonic on @beets-lst?
    - Alert me when my withdrawal is ready @beets-lst
    - How much Sonic does @beets-lst hold?
    - How much is worth my staked Sonic on @beets-lst?
1. **Help**
    - What can I do on @beets-lst?

## Available Functions

- [stake](src/functions/stake.ts)
- [unStake](src/functions/unStake.ts)
- [withdraw](src/functions/withdraw.ts)
- [withdrawAll](src/functions/withdrawAll.ts)
- [getSonicBalance](src/functions/getSonicBalance.ts)
- [getStakedSonicBalance](src/functions/getStakedSonicBalance.ts)
- [getOpenWithdrawRequests](src/functions/getOpenWithdrawRequests.ts)
- [getProtocolSonicToStakedSonicExchangeRate](src/functions/getProtocolSonicToStakedSonicExchangeRate.ts)
- [getProtocolStakedSonicToSonicExchangeRate](src/functions/getProtocolStakedSonicToSonicExchangeRate.ts)
- [getTotalSonicInProtocol](src/functions/getTotalSonicInProtocol.ts)
- [getTotalStakedSonicInProtocol](src/functions/getTotalStakedSonicInProtocol.ts)

## Installation

```bash
pnpm add @heyanon/beets-lst
```

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
pnpm install
cp .env.example .env
# insert test wallet private key into .env
# insert OpenAI or DeepSeek key into .env
```

and then you can ask questions directly:

```bash
pnpm ask "What can I do on Beets LST?"
pnpm ask "Stake 100 S in @beets-lst"
pnpm ask "Unstake all of my stS from @beets-lst"
pnpm ask "How long before I can withdraw from @beets-lst?"
```

To debug the actual LLM responses, run `askBeets` with `--verbose` flag:

```bash
pnpm ask "Stake 100 S in @beets-lst" --verbose
```

## Future improvements

- Warn the user if swapping is more convenient than unstaking and staking.
- Getter to show the dollar value of the user position.
- Getter to show the user's position: Sonic Balance, stS balance, staking APR, pending withdrawals, dollar value.
