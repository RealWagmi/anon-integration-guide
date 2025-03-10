# BetSwirl

The BetSwirl module allows users to interact with various casino games on the [BetSwirl](https://www.betswirl.com) platform. Users can place bets on games such as roulette, dice, and coin toss, and retrieve their betting history. This module provides a seamless integration with the BetSwirl SDK, enabling users to perform these operations on supported blockchain networks.

## Installation

```bash
pnpm add @heyanon/betswirl
```

## Supported Functions

- Place bets on roulette, dice, and coin toss games
- Retrieve the last 5 bets for a given account
- Supported networks: Base, Arbitrum, Avalanche, Polygon, BNB Chain

## Usage

### 1. **Roulette Bets**

> Place a bet of 0.7 ETH on numbers 8, 23, 16 in roulette @BetSwirl on the Base network

> Bet 7 ETH on numbers 7, 12, 25, 16, 18 in roulette @BetSwirl on the Base network

### 2. **Dice Bets**

> Roll a dice @BetSwirl with a bet of 7 ETH on number 4 on the Base network

> Place a bet of 7 ETH on number 5 in dice @BetSwirl game on the Base network

### 3. **Coin Toss Bets**

> Flip a coin @BetSwirl with a bet of 7 ETH on heads on the Base network

> Bet 7 ETH on tails in the coin toss @BetSwirl game on the Base network

### 4. **Retrieve Bets**

> Get the last 5 bets @BetSwirl for account 0x123... on the Base network

> Show my betting history @BetSwirl on the Base network

## Development

1. Install dependencies:
```bash
pnpm install
```

2. Build the project:
```bash
pnpm run build
```

3. Run tests:
```bash
pnpm test
```
