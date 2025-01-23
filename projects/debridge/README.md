# deBridge Module

deBridge is DeFi's internet of liquidity, enabling real-time movement of assets and information across the DeFi landscape.

## Features

### Core Functions

1. **getSupportedChains**
   - Get a list of all chains supported by the deBridge protocol
   - Returns chain IDs and names

2. **getTokenInfo**
   - Get token information from a specific chain
   - Supports both EVM (0x-prefixed) and Solana (base58) addresses
   - Can search by token name/symbol

3. **getBridgeQuote**
   - Get a quote for bridging tokens between chains
   - Includes fees and estimated amounts
   - Supports slippage configuration

4. **createBridgeOrder**
   - Create a cross-chain bridge order
   - Supports EVM-to-EVM, EVM-to-Solana, and Solana-to-EVM transfers
   - Handles native tokens and ERC20/SPL tokens

5. **executeBridgeTransaction**
   - Execute a bridge transaction on the blockchain
   - Takes transaction data from createBridgeOrder
   - Handles transaction signing and submission

6. **checkTransactionStatus**
   - Check the status of a bridge transaction
   - Provides detailed status information and tracking link
   - Supports multiple status types (Created, Fulfilled, etc.)

## Sample Questions

1. **Chain Information**
   - "What chains does deBridge support?"
   - "Is Solana supported on deBridge?"
   - "Show me the supported chain IDs"

2. **Token Information**
   - "Get information about USDC on Ethereum"
   - "Search for tokens with 'USD' in their name on BSC"
   - "What's the token address for WETH on Arbitrum?"

3. **Bridge Quotes**
   - "How much ETH will I receive if I bridge 1000 USDC from Ethereum to BSC?"
   - "What are the fees for bridging tokens from Solana to Ethereum?"
   - "Get a quote for bridging 0.5 ETH to Arbitrum"

4. **Bridge Operations**
   - "Bridge 100 USDC from Ethereum to BSC"
   - "Send 1 ETH from Ethereum to Arbitrum"
   - "Transfer 1000 USDT from BSC to my Solana wallet"

5. **Transaction Status**
   - "Check the status of my bridge transaction"
   - "Is my token transfer complete?"
   - "Track my cross-chain transaction"

## Special Considerations

### Chain-Specific Requirements

1. **EVM to EVM Transfers**
   - Use 0x-prefixed addresses
   - Native token address: 0x0000000000000000000000000000000000000000

2. **To Solana (Chain ID: 7565164)**
   - Recipient must be a base58 Solana address
   - Token must be a Solana token mint address (base58)

3. **From Solana**
   - Recipient must be an EVM address (0x-prefixed)
   - Token must be an ERC-20 format address

### Error Handling

The module provides clear error messages for common issues:
- Invalid addresses
- Insufficient balance
- Network errors
- Unsupported chains/tokens

## Development

### Requirements
- Node.js 16+
- pnpm or yarn

### Installation
```bash
pnpm install
# or
yarn install
```

### Dependencies
- @heyanon/sdk: Core framework functionality
- axios: HTTP client for API requests
- viem: Ethereum utility functions
