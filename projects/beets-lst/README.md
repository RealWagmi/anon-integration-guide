# beets-lst

Integration with beets.fi Sonic liquid staking module (stS). The integration supports staking S into stS and unstaking back to S. The unstaking is a 2-step process: first undelegate, then claim Sonic after 14 days.

## Supported Networks

- SONIC

## Common Tasks

1. Basic Operations

    - **Staking**
        - "Stake 100 S in @beets-lst"
        - "Stake half of my Sonic in @beets-lst"
        - "How many stS do I have in @beets-lst
    - **Unstaking**
        - "Unstake 100 stS from @beets-lst"
        - "Unstake all of my stS from @beets-lst"
        - "Unstake 100 S worth of stS from @beets-lst"
    - **Withdrawing**
        - "How long before I can withdraw from @beets-lst?"
        - "Show open withdrawals from @beets-lst"
        - "Claim <withdraw_id> from @beets-lst"
        - "Claim all from @beets-lst"
    - **Info**
        - "How much is worth 1 stS in @beets-lst?"
        - "How much is worth 1 S in @beets-lst?"
        - "How much Sonic is in the protocol @beets-lst?"

## Available Functions

List of available functions will be added here.

## Installation

```bash
yarn add @heyanon/beets-lst
```

## Usage

Example usage will be added here.

## Contracts and transactions

- Liquid staking proxy contract: https://sonicscan.org/address/0xe5da20f15420ad15de0fa650600afc998bbe3955
- Liquid staking current implementation: https://sonicscan.org/address/0xd5f7fc8ba92756a34693baa386edcc8dd5b3f141
- Stake Sonic (`deposit`): https://sonicscan.org/tx/0x19545670b77c9ab7e1eabdab292c1aa9d0abd6e11777ab3147f343cb900c728b
- Initiate unstake (`undelegateMany`): https://sonicscan.org/tx/0xb64c4fd6ae4667a3b7ce9d6ba9679fbd2c591173a0895a5616adc3b039b10c27
- Withdraw Sonic (`withdraw`): https://sonicscan.org/tx/0xb93b07384ccbace4236d07fac46874039821c84707f69fbee101e9ae5506f470
