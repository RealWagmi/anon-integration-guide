# Goddog DeFi Integration Library

A TypeScript-based DeFi integration library for managing Uniswap V3 liquidity and vault operations on the Arbitrum network.

## Overview

Goddog simplifies DeFi operations on Arbitrum by providing seamless integration with Uniswap V3 and vault management. The protocol enables:

- One-sided liquidity provision to Uniswap V3 pools
- Automated vault creation and management
- Efficient token deposits and withdrawals
- Automated token approvals and transaction handling

## Supported Networks
- Arbitrum One (Chain ID: 42161)

## 🤝 How can I help you today?

Start by selecting what you want to do:

### Option A: "I want to provide liquidity" 🌊
Then choose:
1. Token Selection
   ```
   Select: [ETH] [USDC] [USDT] [Other]
   ```

2. Amount
   ```
   Enter: [Specific Amount] or [MAX]
   ```

Example result: "Add 0.1 ETH to a new Uniswap V3 pool"

### Option B: "I want to use vaults" 🏦
Then choose:
1. Action Type
   ```
   Select: [Create] [Deposit] [Withdraw] [View]
   ```

2. If Create:
   ```
   Select Pool: [ETH/USDC] [ETH/USDT] [Custom]
   ```

3. If Deposit/Withdraw:
   ```
   Select Vault: [Your Active Vaults]
   Enter Amount: [Amount] or [MAX]
   ```

Example result: "Create new vault for ETH/USDC"

Just select your options, and I'll help you build the perfect command! 🎯

## Pain Points Solved by Goddog

1. **Complex Liquidity Management**
   - Simplified one-sided liquidity provision
   - Automated price range calculation
   - Smart rebalancing strategies
   - Reduced impermanent loss through vault strategies

2. **DeFi Accessibility**
   - One-click vault creation
   - Automated token approvals
   - Simplified position management
   - Clear transaction status updates

3. **Risk Management**
   - Built-in slippage protection
   - Automated position monitoring
   - Configurable risk parameters
   - Real-time position analytics

4. **Gas Optimization**
   - Batched transactions
   - Efficient contract interactions
   - Optimized approval process
   - Smart gas estimation

## Installation and Setup

1. Install the package:
```bash
npm install
```

2. Configure environment:
```env
PRIVATE_KEY=your_private_key_here
INFURA_KEY=your_infura_key_here
```

## Core Functions

### addLiquidityOnUniswapV3

```typescript
const params = {
    account: "0x...", // Your wallet address
    tokenAddress: "0x...", // Token address to provide liquidity for
    tokenAmount: "0.01", // Amount of tokens to add
    chainId: 42161, // Arbitrum chainId
};

const result = await addLiquidityOnUniswapV3(params, { notify, getProvider, sendTransactions });
```

### createVault

```typescript
const params = {
    account: "0x...", // Your wallet address
    poolAddress: "0x...", // Uniswap V3 pool address
    agentAddress: "0x...", // Address that will call rebalance function
    chainId: 42161, // Arbitrum chainId
};

const result = await createVault(params, { notify, getProvider, sendTransactions });
```

### depositToVault

```typescript
const params = {
    account: "0x...", // Your wallet address
    vaultAddress: "0x...", // Vault address
    amount0: "1", // Amount of token0 to deposit
    amount1: "0.1", // Amount of token1 to deposit
    recipient: "0x...", // Address to receive share tokens
    chainId: 42161, // Arbitrum chainId
};

const result = await depositToVault(params, { notify, getProvider, sendTransactions });
```

### withdrawFromVault

```typescript
const params = {
    account: "0x...", // Your wallet address
    vaultAddress: "0x...", // Vault address
    shareAmount: "0.5", // Amount of share tokens to burn
    recipient: "0x...", // Address to receive underlying tokens
    chainId: 42161, // Arbitrum chainId
};

const result = await withdrawFromVault(params, { notify, getProvider, sendTransactions });
```

## Error Handling

All functions return a `FunctionReturn` type:

```typescript
interface FunctionReturn {
    message: string;
    error?: boolean;
}
```

Error handling example:
```typescript
const result = await depositToVault(params, options);
if (result.error) {
    console.error('Operation failed:', result.message);
    return;
}
```

## Security Considerations

1. **Private Key Safety**: Never commit your private key or expose it in client-side code
2. **Token Approvals**: The library handles token approvals automatically, but be aware of approval amounts
3. **Slippage Protection**: Use appropriate minimum amounts when depositing/withdrawing
4. **Network Confirmation**: Always verify you're connected to Arbitrum network

## Testing

1. Set up environment:
```bash
npm install -D vitest @types/node
```

2. Run tests:
```bash
npm run test
```

## Network Details

Arbitrum One Configuration:
- Network Name: Arbitrum One
- Chain ID: 42161
- RPC URL: https://arb1.arbitrum.io/rpc
- Currency: ETH

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License
