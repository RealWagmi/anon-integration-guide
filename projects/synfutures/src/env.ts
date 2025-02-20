// Environment variables for SynFutures integration

// Network Configuration
export const CHAIN_NAME = process.env.CHAIN_NAME || 'BASE_SEPOLIA';
export const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org';

// Wallet Configuration
export const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Trading Configuration
export const TRADING_PAIR = process.env.TRADING_PAIR || 'ETH-USDC';
export const SLIPPAGE_TOLERANCE = process.env.SLIPPAGE_TOLERANCE ? parseFloat(process.env.SLIPPAGE_TOLERANCE) : 0.5;
export const MIN_MARGIN = process.env.MIN_MARGIN ? parseFloat(process.env.MIN_MARGIN) : 0.01;
export const DEFAULT_LEVERAGE = process.env.DEFAULT_LEVERAGE ? parseInt(process.env.DEFAULT_LEVERAGE, 10) : 2;

// OpenAI Configuration
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Test Mode
export const IS_TEST = process.env.IS_TEST === 'true' || process.env.NODE_ENV !== 'production';