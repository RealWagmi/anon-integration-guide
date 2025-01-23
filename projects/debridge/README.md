# deBridge Module

deBridge is DeFi's internet of liquidity, enabling real-time movement of assets and information across the DeFi landscape. The protocol supports cross-chain token transfers and swaps across multiple networks including Ethereum, Base, Solana, Arbitrum, Optimism, and more.

## Common Tasks

1. Cross-Chain Token Transfers

   - "Bridge 5000 ETH from Base to Solana as DBR tokens"
   - "Send 1000 USDC from Ethereum to Arbitrum"
   - "Transfer 500 USDT from Optimism to Base"
   - "Move 10 ETH from Base to Arbitrum with 0.5% slippage"

2. Same-Chain Token Swaps

   - "Swap 1 ETH for USDbC on Base"
   - "Exchange 1000 USDC for ETH on Ethereum"
   - "Trade 500 USDT for WETH on Arbitrum"

3. Transaction Status Checks

   - "Check status of my bridge transaction 0x19fa026c..."
   - "Track my token transfer from Base to Solana"
   - "Get order status for my cross-chain swap"
   - "View all orders for my bridge transaction"

4. Information Queries

   - "List all supported chains in @deBridge"
   - "Get token info for USDC on Ethereum"
   - "Show supported tokens on Solana"
   - "Get bridge quote for ETH to DBR transfer"

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

4. **executeBridgeTransaction**
   - Execute a bridge transaction on the blockchain
   - Takes transaction data from createBridgeOrder
   - Handles transaction signing and submission
   - Returns transaction hash and success status

5. **checkTransactionStatus**
   - Check the status of a bridge transaction by its transaction hash
   - Retrieves order IDs associated with the transaction
   - Provides detailed status information and tracking link
   - Supports multiple status types:
     - None: Order not found or invalid
     - Created: Order created but not yet processed
     - Fulfilled: Order has been processed and tokens are being transferred
     - SentUnlock: Tokens have been unlocked on the destination chain
     - OrderCancelled: Order was cancelled by the user or system
     - SentOrderCancel: Cancellation request has been sent
     - ClaimedUnlock: Tokens have been claimed by the recipient
     - ClaimedOrderCancel: Cancellation has been completed and tokens returned

## Pain Points Solved

1. **Cross-Chain Complexity**
   - Simplifies cross-chain token transfers with a unified API
   - Handles complex bridging logic and transaction routing
   - Provides real-time status updates and tracking

2. **Transaction Monitoring**
   - Easy tracking of cross-chain transactions
   - Clear status messages and descriptions
   - Direct links to transaction explorer

3. **Token Discovery**
   - Comprehensive token information across chains
   - Easy verification of token addresses and decimals
   - Support for both EVM and Solana tokens

4. **Quote Accuracy**
   - Real-time price quotes for transfers
   - Includes all fees and slippage
   - Supports both same-chain and cross-chain quotes

## Tests

Current test coverage:

### Implemented Tests
- `getSupportedChains`: Verifies supported chains list and their IDs
- `getTokenInfo (ETH)`: Lists Ethereum tokens, verifies USDT, USDC, WETH presence
- `getTokenInfo (SOL)`: Checks DBR token on Solana with specific address
- `getBridgeQuote`: Tests both cross-chain (Base -> Solana DBR) and same-chain (Base ETH -> USDbC) quotes
- `executeBridgeTransaction`: Tests execution of both same-chain and cross-chain transactions
- `checkTransactionStatus`: Verifies transaction status retrieval and order tracking

### Planned Tests
- Token search functionality across chains
- Invalid token address handling
- Unsupported chain ID error cases
- Error handling for failed transactions
- Cancellation flow testing

## Development

### Requirements
- Node.js
- yarn

### Installation
```bash
yarn install
```

### Running Tests
```bash
yarn test
