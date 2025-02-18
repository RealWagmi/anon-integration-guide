# synfutures

Integration with SynFutures - Permissionless Derivatives Protocol

## Supported Networks

- BASE

## Protocol Overview
SynFutures is a permissionless derivatives protocol featuring:
- Single-Token Concentrated Liquidity for Derivatives
- Permissionless On-chain Orderbook
- Single Model for Unified Liquidity
- Advanced Stabilization Mechanisms

## Core Features
- Permissionless listings ("anything against anything")
- Concentrated liquidity with leverage
- Unified liquidity system (AMM + Orderbook)
- Dynamic penalty fees for price stability
- Stabilized mark prices mechanism

## Installation

```bash
yarn add @heyanon/synfutures
```

## Environment Setup

Create a `.env` file with the following variables:
```env
# Network Configuration
CHAIN_NAME=BASE
RPC_URL=https://mainnet.base.org  # or https://goerli.base.org for testnet

# Wallet Configuration
PRIVATE_KEY=your_private_key_here  # Required for sending transactions

# Trading Configuration
TRADING_PAIR=ETH-USDC
SLIPPAGE_TOLERANCE=0.5  # Default slippage tolerance in percentage
MIN_MARGIN=0.01
DEFAULT_LEVERAGE=2

# Test Mode (optional)
IS_TEST=true  # Set to true for testing without actual transactions
```

## Usage

### Command Line Interface
Run commands using natural language:
```bash
npx ts-node examples/run.ts "your command here" [--verbose]
```

### Supported Commands

1. Market Orders
```bash
# Buy at market price
npx ts-node examples/run.ts "Buy 1 ETH at market price"

# Sell at market price
npx ts-node examples/run.ts "Sell 0.5 ETH at market price"
```

2. Limit Orders
```bash
# Place limit buy order
npx ts-node examples/run.ts "Place a limit buy order for 1 ETH at 1800 USDC"

# Place limit sell order
npx ts-node examples/run.ts "Place a limit sell order for 0.5 ETH at 2000 USDC"
```

3. Leveraged Positions
```bash
# Open long position
npx ts-node examples/run.ts "Open a long position with 2x leverage using 0.1 ETH as margin"

# Open short position
npx ts-node examples/run.ts "Open a short position with 5x leverage using 0.2 ETH as margin"
```

4. Liquidity Management
```bash
# Provide liquidity
npx ts-node examples/run.ts "Provide liquidity to ETH-USDC pool between 1800-2200 with 1 ETH"

# Remove liquidity
npx ts-node examples/run.ts "Remove 50% liquidity from position #123"
```

### Programmatic Usage

```typescript
import { askSynFutures } from '@heyanon/synfutures';

async function executeCommand() {
    const result = await askSynFutures("Buy 1 ETH at market price", {
        verbose: true,
        notify: async (message) => console.log(`[Notification] ${message}`)
    });

    if (result.success) {
        console.log('Success:', result.data);
    } else {
        console.error('Error:', result.data);
    }
}
```

## Key Parameters
- Available Leverage: 2x, 5x, 10x, 15x, 25x
- Default Slippage Tolerance: 0.5%
- Minimum Margin: 0.01 ETH
- Supported Trading Pairs: ETH-USDC (more coming soon)

## Testing

1. Set up test environment:
```bash
# Install dependencies
yarn install

# Configure test environment
cp .env.example .env
# Edit .env and set IS_TEST=true
```

2. Run tests:
```bash
# Run all tests
yarn test

# Run specific test
yarn test __tests__/integration.test.ts
```

## Development

### Building
```bash
# Build the project
yarn build

# Watch mode
yarn build --watch
```

### Linting
```bash
# Run linter
yarn lint

# Fix linting issues
yarn lint --fix
```

## Error Handling

Common errors and solutions:

1. "Wallet not connected"
   - Ensure PRIVATE_KEY is set in .env

2. "Unsupported chain"
   - Verify CHAIN_NAME is set to 'BASE'

3. "Invalid leverage"
   - Use supported leverage values: 2x, 5x, 10x, 15x, 25x

4. "Insufficient margin"
   - Ensure margin amount meets minimum requirement (0.01 ETH)

## Command Format Guidelines

1. Market Orders:
   - "Buy/Sell [amount] ETH at market price"

2. Limit Orders:
   - "Place a limit buy/sell order for [amount] ETH at [price] USDC"

3. Leveraged Positions:
   - "Open a long/short position with [2-25]x leverage using [amount] ETH as margin"

4. Liquidity:
   - Provide: "Provide liquidity to ETH-USDC pool between [lower]-[upper] with [amount] ETH"
   - Remove: "Remove [percentage]% liquidity from position #[id]"

## Security Considerations

1. Private Key Safety
   - Never commit your .env file
   - Use test mode (IS_TEST=true) for development

2. Transaction Safety
   - Always specify slippage tolerance
   - Review transaction details in verbose mode
   - Test commands with small amounts first

## Support

For issues and feature requests, please contact the development team or create an issue in the repository. 