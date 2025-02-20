# SynFutures Integration

## Overview

SynFutures is a decentralized derivatives trading protocol that enables permissionless futures trading with unique features like single-token concentrated liquidity and a unified orderbook system. This integration allows users to trade futures, manage positions, and provide liquidity through natural language commands.

### Key Features

1. Permissionless Derivatives Trading
   - Trade any asset against any other asset
   - Market and limit orders
   - Leveraged positions up to 25x

2. Advanced Liquidity Management
   - Single-token concentrated liquidity
   - Dynamic fee adjustment
   - Flexible range positions

3. Risk Management
   - Stop-loss and take-profit orders
   - Dynamic funding rates
   - Price stabilization mechanisms

## Supported Networks

- BASE (Base Mainnet, 8453)
- BASE_SEPOLIA (Base Sepolia Testnet, 84532)

## Example Tasks

### Trading Operations

1. Market Orders
   - "Buy 0.1 ETH at market price"
   - "Sell 0.05 ETH at market price with 0.5% slippage"
   - "Execute market buy for 1000 USDC worth of ETH"

2. Limit Orders
   - "Place a limit buy order for 0.2 ETH at 2500 USDC"
   - "Set a sell limit order for 0.1 ETH at 3000 USDC"
   - "Create a post-only limit order to buy ETH at 2400"

3. Leveraged Positions
   - "Open a long position with 5x leverage using 0.1 ETH as margin"
   - "Create a 10x short position with 0.05 ETH margin"
   - "Open a leveraged long with stop-loss at 2200 and take-profit at 3000"

### Liquidity Management

1. Providing Liquidity
   - "Add liquidity to ETH-USDC pool between 2000-3000 with 0.5 ETH"
   - "Provide concentrated liquidity with 1 ETH in current price range"
   - "Supply liquidity to ETH-USDC with dynamic fees enabled"

2. Managing Positions
   - "Remove 50% liquidity from position 0x123..."
   - "Adjust liquidity range to 2200-2800 for position 0x456..."
   - "Claim accumulated fees from my liquidity position"

3. Position Information
   - "Show my active liquidity positions"
   - "Calculate expected returns for my position"
   - "Check accumulated fees in my positions"

## Prerequisites

- Node.js v18 or higher
- pnpm package manager
- Base network wallet with ETH for gas

## Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm run build

# Run tests
pnpm run test:batch
```

## Configuration

The project uses environment variables configured through the HeyAnon platform. These are defined in `src/env.ts`:

```typescript
// Network Configuration
export const CHAIN_NAME = process.env.CHAIN_NAME || 'BASE_SEPOLIA';
export const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org';

// Trading Configuration
export const TRADING_PAIR = process.env.TRADING_PAIR || 'ETH-USDC';
export const SLIPPAGE_TOLERANCE = process.env.SLIPPAGE_TOLERANCE ? parseFloat(process.env.SLIPPAGE_TOLERANCE) : 0.5;
export const MIN_MARGIN = process.env.MIN_MARGIN ? parseFloat(process.env.MIN_MARGIN) : 0.01;
export const DEFAULT_LEVERAGE = process.env.DEFAULT_LEVERAGE ? parseInt(process.env.DEFAULT_LEVERAGE, 10) : 2;

// OpenAI Configuration
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Test Mode
export const IS_TEST = process.env.IS_TEST === 'true' || process.env.NODE_ENV !== 'production';
```

For local development, create a `.env` file with the following variables:

```bash
# Required: Your private key for signing transactions
PRIVATE_KEY=your_private_key_here

# Required: OpenAI API key for natural language processing
OPENAI_API_KEY=your_openai_api_key_here

# Optional configurations (defaults shown)
RPC_URL=https://sepolia.base.org
CHAIN_NAME=BASE_SEPOLIA
SLIPPAGE_TOLERANCE=0.5
TRADING_PAIR=ETH-USDC
MIN_MARGIN=0.01
DEFAULT_LEVERAGE=2
IS_TEST=true
```

## Usage

### Command Line Interface
```bash
# Execute a market order
pnpm run ask "Buy 0.1 ETH at market price"

# Place a limit order
pnpm run ask "Place a limit sell order for 0.05 ETH at 3000 USDC"

# Manage liquidity
pnpm run ask "Provide liquidity to ETH-USDC pool between 2000-3000 with 0.1 ETH"
```

### Programmatic Usage
```typescript
import { askSynFutures } from '@heyanon/synfutures';

async function executeCommand() {
    const result = await askSynFutures("Buy 0.1 ETH at market price", {
        verbose: true,
        notify: async (message) => console.log(`[Notification] ${message}`)
    });

    console.log(result.success ? 'Success:' : 'Error:', result.data);
}
```

## Key Parameters

- Available Leverage: 2x, 5x, 10x, 15x, 25x
- Default Slippage: 0.5%
- Minimum Margin: 0.01 ETH
- Supported Pairs: ETH-USDC (more coming soon)

## Testing

### Quick Start Testing

To test a single command:

```bash
# Test a specific command
pnpm run ask "Buy 0.1 ETH at market price" --verbose

# Test with custom parameters
pnpm run ask "Open a long position with 5x leverage using 0.1 ETH as margin" --verbose
```

The `--verbose` flag provides detailed output including:
- Wallet balance check
- Transaction details
- Transaction hash and explorer link
- Execution status and results

### Batch Testing

The project includes a comprehensive test suite that covers all major functionality:

```bash
# Run all test cases
pnpm run test:batch
```

The batch test:
- Executes 10+ test cases across different categories
- Tests market orders, limit orders, leveraged positions
- Verifies error handling and edge cases
- Generates a detailed test report

Test categories include:
1. Market Orders
   - Buy/Sell at market price
   - Slippage handling
   - Amount validation

2. Limit Orders
   - Price limits
   - Post-only orders
   - Order validation

3. Leveraged Positions
   - Multiple leverage levels
   - Stop-loss and take-profit
   - Margin requirements

4. Liquidity Management
   - Adding/removing liquidity
   - Range adjustments
   - Fee collection

5. Error Cases
   - Invalid parameters
   - Insufficient balance
   - Position validation

The test report (`test-report.md`) includes:
- Overall success rate
- Category-wise breakdown
- Detailed error logs
- Transaction hashes
- Environment details

## Error Handling

Common errors and solutions:

1. "Insufficient balance"
   - Ensure wallet has enough ETH for transaction and gas
   - Minimum required: 0.01 ETH

2. "Invalid leverage value"
   - Use supported leverage values: 2x, 5x, 10x, 15x, 25x

3. "Price range invalid"
   - Upper price must be greater than lower price
   - Ranges must be within allowed ticks

4. "Position not found"
   - Verify position ID is correct
   - Check if position is still active

## Security Considerations

1. Private Key Safety
   - Store in secure environment variables
   - Never commit sensitive data
   - Use test mode for development

2. Transaction Safety
   - Always specify slippage tolerance
   - Review transaction details in verbose mode
   - Test with small amounts first


