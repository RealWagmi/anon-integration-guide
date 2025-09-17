# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Build and Development
- `pnpm build` - Build the project using tsup
- `pnpm start` - Watch mode for development (rebuilds on changes)
- `pnpm format` - Format code with Prettier

### Testing the Integration
- `pnpm ask-bybit "YOUR_QUERY"` - Test the integration with a trading command
- `pnpm ask-bybit "YOUR_QUERY" --debug-llm` - Test with LLM request/response debugging
- `pnpm test` - Run tests with vitest (currently no tests implemented)

### Linting and Type Checking
- `pnpm lint` - Run linting with tsdx
- TypeScript compilation happens automatically during build

## High-Level Architecture

This is a Bybit cryptocurrency exchange integration for HeyAnon.ai that provides a conversational AI interface for trading on Bybit's spot and futures markets.

### Core Architecture Components

1. **HeyAnon SDK Integration** (`/src/index.ts`)
   - Main export satisfies the `AdapterExport` interface from `@heyanon/sdk`
   - Exposes trading functions and AI tools to the HeyAnon platform

2. **AI Tool Definitions** (`/src/tools.ts`)
   - 23 AI tools defined for the LLM to understand and execute trading operations
   - Each tool has detailed descriptions, parameters, and validation
   - Tools are categorized: account info, market data, order management, position management

3. **Trading Functions** (`/src/functions/`)
   - Each function implements a specific trading operation
   - Functions use CCXT library for exchange communication
   - Extended with custom Bybit-specific features via helper functions

4. **CCXT Extensions** (`/src/helpers/exchange.ts`)
   - Custom functions that extend CCXT to cover Bybit-specific features not in the standard library:
     - `attachTakeProfitAndOrStopLossOrderToExistingPosition`
     - `getAccountMarginMode`
     - `addOrReducePositionMargin`
     - `getUserOpenOrders`
     - `getOrderById`

5. **Test Agent** (`/src/agent/`)
   - CLI tool for testing the integration locally
   - Uses OpenAI or DeepSeek for natural language processing
   - Simulates the HeyAnon environment for development

### Key Design Decisions

1. **Unified Trading Account (UTA 2.0 Pro)**
   - No separate spot/futures wallets - single unified balance
   - No fund transfers needed between account types
   - `enableUnifiedAccount: true` must be set on exchange object

2. **Market Type Inference**
   - LLM infers market type from context:
     - "buy/sell" → spot market
     - "long/short" → futures (perpetual by default)
     - Delivery dates mentioned → delivery futures

3. **Account-Level vs Market-Level Settings**
   - Margin mode (cross/isolated/portfolio) applies to entire account
   - Leverage settings apply per market
   - Critical distinction from other exchanges

4. **Order Type Mappings**
   - Futures OCO: TP/SL on existing position
   - Futures OTOCO: New position with TP/SL attached
   - Spot OTOCO: Limit order with TP/SL (market orders not supported)
   - Spot OCO: Simulated via two conditional orders

5. **Settlement Currency Support**
   - Supports USDT and USDC as settlement currencies
   - Required parameter for listing operations due to Bybit API requirements

### Environment Configuration

Required environment variables (see `.env.example`):
- `OPENAI_API_KEY` or `DEEPSEEK_API_KEY` - For test agent
- `BYBIT_API_KEY` and `BYBIT_SECRET_KEY` - Production credentials
- `BYBIT_USE_TESTNET` - Toggle testnet mode
- `BYBIT_TESTNET_API_KEY` and `BYBIT_TESTNET_SECRET_KEY` - Testnet credentials

Note: Bybit API keys expire after 3 months without IP whitelisting.

### Important Constants

- `MAX_MARKETS_IN_RESULTS`: 30 - Limit for market listings
- `MAX_ORDERS_IN_RESULTS`: 100 - Limit for order queries
- `MAX_POSITIONS_IN_RESULTS`: 100 - Limit for position queries
- `SUPPORTED_SETTLE_CURRENCIES`: ['USDT', 'USDC']
- `SUPPORTED_MARKET_TYPES`: ['spot', 'perpetual', 'delivery']