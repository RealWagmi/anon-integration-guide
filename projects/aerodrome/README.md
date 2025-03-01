# aerodrome

Integration with [Aerodrome](https://aerodrome.finance/)

## Supported Networks

- BASE

## Common Tasks

- "Retrieve me pool address for wETH and USDC with lowest fee"
- "Get tick spacing for existing pool at address"
- "Compute me path for given list of tokens and fees"
- "Estimate amount of USDC I will receive for swapping in 10 AERO"
- "Swap 10 USDC into AERO using V3 version of protocol and leverage both - V2 and V3 pools"
- "Swap 5 AERO into USDC using V2 version of protocol and only V2 pools"
- "Execute chain of commands: Wrap 1 ETH to wETH (code: `0b`), Swap wETH to AERO using V3 (code: `00`), Swap AERO to USDC using V2 (code: `08`)"

## Available Functions

- `getPool`: Get address of Pool from PoolFactory for given tokens and fee associated with pool
- `getTickSpacing`: Retrieve tick spacing of existing Pool
- `getPath`: Get path encoding multiple Pools from given tokens and fees
- `quoteExactInput`: Estimate output amount of swap without actually performing swap
- `swapV3`: Perform swap using Aerodrome V3 contracts (accepts V3 and V2 pools)
- `swapV2`: Perform swap using Aerodrome V2 contracts (accepts V2 pools only)
- `execute`: Execute arbitrary complex chain of commands. See available commands in `CommandCode` constant

## Installation

```bash
yarn add @heyanon/aerodrome
```
