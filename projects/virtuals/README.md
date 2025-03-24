# virtuals

GAME is a decision-making engine built on Virtuals and can be used to power agents in different environments and platforms. Integrating with Virtuals (GAME) is not as simple as integrating with a DEX or other DEFI protocols. As the Twitter AI agent implemented by Virtauls is not interactive and the owner can not send an instruction to it directly, in the first step we aim to implement interactive agents that let users be in touch with them and do some tasks automatically. In the first step, we've implemented a simple crypto agent, but more AI agents will be implemented.

## TODO

- Implement more AI agents.
- Let users to launch their AI agents (on top of GAME engin) only by sending a prompt. 

## Common Tasks

1. Basic Operations
   - "Analyze a token price/market using Virtuals crypto agent"
2. Information Queries
   - "Query a token price using Virtuals crypto agent"


## Available Functions

- **interactCryptoAgent**: Interact with crypto agent

## Installation

```bash
yarn add @heyanon/virtuals
```

## Usage

In order to use the Virtauls integration a user can send a prompt like "Send following prompt to Virtuals crypto agent: 'Please analyze ZRO short term price. last piece of news: A key part of USDT0's architecture is its use of the LayerZero omnichannel fungible token (OFT) standard, known for enabling secure, cost-efficient asset transfers across multiple chains. According to the firm, this setup boosts transaction speeds while keeping fees affordable and security protocols intact.'" to the HeyAnon.
