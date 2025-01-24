# benqi-staking

Integration with [Benqi Staking](https://staking.benqi.fi/)

## Supported Networks

- AVALANCHE

## Common Tasks

1. Staking Operations

- "Stake 1000 AVAX tokens in @benqi-staking"
- "Execute stakeQi operation with 500 QI tokens in @benqi-staking"
- "Unstake 500 AVAX tokens from @benqi-staking"
- "Unstake 1000 QI tokens from @benqi-staking"
- "Redeem unstaked AVAX tokens in @benqi-staking"
- "Vote for nodes with ids 1, 2 with weights equal to 80, 20 in @benqi-staking"
- "Unvote nodes with ids 1, 2 with weights equal to 80, 20"
- "Cancel pending unlock requests for AVAX tokens in @benqi-staking"
- "Cancel pending unlock requests for QI tokens in @benqi-staking"
- "Get amount of votes a user has"
- "Get list of nodes with weights the user has voted for"

## Available Functions

- `cancelPendingUnlockRequests`: Cancel pending unlock requests for a specified asset in @benqi-staking
- `getUserVotesLength`: Get amount of votes a user has
- `getUserVotesRange`: Get list of nodes with weights the user has voted for
- `redeemUnstakedAvax`: Redeem a specified amount of unstaked AVAX tokens in @benqi-staking
- `stakeAvax`: Stake a specified amount of AVAX tokens in @benqi-staking
- `stakeQi`: Stake a specified amount of QI tokens in @benqi-staking
- `unstakeAvax`: Unstake a specified amount of AVAX tokens from @benqi-staking
- `unstakeQi`: Unstake a specified amount of QI tokens from @benqi-staking
- `unvoteNodes`: Unvote for specified nodes in @benqi-staking
- `voteNodes`: Vote for specified nodes with a specified amount of tokens in @benqi-staking

## Installation

```bash
yarn add @heyanon/benqi-staking
```

## Usage

Example usage will be added here.
