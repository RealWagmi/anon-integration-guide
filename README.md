# beets-lst

Integration with beets.fi Sonic liquid staking module (stS). The integration supports staking S into stS and unstaking back to S. The unstaking is a 2-step process: first undelegate, then claim Sonic after 14 days.

## Supported Networks

- SONIC

## Common Tasks

1. Basic Operations

    - "Stake 100 S in @beets-lst"
    - "Stake half of my Sonic in @beets-lst"
    - "Unstake 100 stS from @beets-lst"
    - "Unstake all of my stS from @beets-lst"
    - "Withdraw all of my stS from @beets-lst"

2. Information Queries
    - "Get my stS balance in @beets-lst"
    - "How long before I can withdraw S from @beets-lst?"

## Available Functions

List of available functions will be added here.

## Installation

```bash
yarn add @heyanon/beets-lst
```

## Usage

Example usage will be added here.

## Contracts and transactions

- Liquid staking contract: https://sonicscan.org/address/0xe5da20f15420ad15de0fa650600afc998bbe3955
- Stake Sonic (`deposit`): https://sonicscan.org/tx/0x19545670b77c9ab7e1eabdab292c1aa9d0abd6e11777ab3147f343cb900c728b
- Initiate unstake (`undelegateMany`): https://sonicscan.org/tx/0xb64c4fd6ae4667a3b7ce9d6ba9679fbd2c591173a0895a5616adc3b039b10c27
- Withdraw Sonic (`withdraw`): https://sonicscan.org/tx/0xb93b07384ccbace4236d07fac46874039821c84707f69fbee101e9ae5506f470
- Claim rewards (`claimRewards`): https://sonicscan.org/tx/0xf46de5d07b1feeaf132e58ae0a87075a2cf9308698ab4837c76c0a2b7dd62aa5

## Test integration

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
yarn run ask "What is my stS balance?"
yarn run ask "Stake 0.1 S"
yarn run ask "Unstake all of my stS"
```

The agent will perform one or more tasks to execute your request; see for example this GIF where I asked to bot to unstake all of my stS:



https://github.com/user-attachments/assets/2ce0d109-85b5-4548-8bad-2c4bfadaeacf



If you need to see the OpenAI messages, for debug purposes, run with `--verbose` flag:

```bash
yarn run ask "What is my stS balance?" --verbose
```
