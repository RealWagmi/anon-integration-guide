# beets-lst

Integration with beets.fi Sonic liquid staking module (stS). The integration supports staking S into stS and unstaking back to S. The unstaking is a 2-step process: first undelegate, then claim Sonic after 14 days.

## Supported Networks

- SONIC

## Common Tasks

1. Basic Operations

    - "Stake 100 S in @beets-lst"
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
