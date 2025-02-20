# Flatcoin Integration for Automate - Updated

## Overview

This PR implements a comprehensive integration with Flatcoin, an ETH-backed stablecoin protocol on BASE network. The integration enables natural language interaction with core Flatcoin functionality through the HeyAnon AI Chatbot, with improved validation, error handling, and user experience.

## Protocol Information

* **Name**: Flatcoin
* **Type**: ETH-backed stablecoin protocol with leveraged trading
* **Chain**: BASE
* **Key Contracts**:
  * FlatcoinVault: `0x95Fa1ddc9a78273f795e67AbE8f1Cd2Cd39831fF`
  * LeverageModule: `0xdB0Cd65dcc7fE07003cE1201f91E1F966fA95768`
  * StableModule: `0xb95fB324b8A2fAF8ec4f76e3dF46C718402736e2`
  * DelayedOrder: `0x6D857e9D24a7566bB72a3FB0847A3E0e4E1c2879`
  * OracleModule: `0xAba633927BD8622FBBDd35D291A914c2fDAaE1Ff`

## Key Improvements

1. **Enhanced Natural Language Processing**
   * Improved command recognition with extensive keyword matching
   * Better argument extraction from user queries
   * Clearer error messages and suggestions

2. **Robust Parameter Validation**
   * Added validation helpers for amounts, leverage, and slippage
   * Implemented comprehensive argument validation
   * Clear feedback for invalid inputs

3. **Improved Error Handling**
   * Structured error messages for all operations
   * Detailed feedback for failed transactions
   * Chain compatibility verification

4. **Testing Infrastructure**
   * Added comprehensive test suite
   * Mock function implementation for testing
   * Validation test cases
   * Error handling verification

## Implemented Functions

1. **UNIT Token Operations**
   * `mintUnit`: Deposit rETH to mint UNIT tokens
   * `redeemUnit`: Redeem UNIT tokens back to rETH

2. **Leverage Trading**
   * `openLongPosition`: Open leveraged positions (2x-25x)
   * `addCollateral`: Add collateral to existing positions
   * `closePosition`: Close leveraged positions

3. **Helper Functions**
   * `getKeeperFee`: Standalone function for fee calculation
   * Validation helpers for amounts and parameters

## Technical Improvements

1. **Code Structure**
   * Modular function organization
   * Clear separation of concerns
   * Consistent error handling
   * Type-safe implementations

2. **Safety Features**
   * Slippage protection
   * Amount validation
   * Leverage limits
   * Chain verification

3. **Documentation**
   * Comprehensive README
   * Clear usage examples
   * Detailed parameter descriptions
   * Best practices guide

## Testing Results

✅ Core Functionality Tests
- Mint UNIT operations
- Redeem UNIT operations
- Leverage position management
- Parameter validation
- Error handling

✅ Integration Tests
- Chain compatibility
- Contract interactions
- Transaction flow
- Error scenarios

## Changes Made

1. Updated `tools.ts`:
   * Added comprehensive validation
   * Improved argument extraction
   * Enhanced error messages
   * Added test support

2. Enhanced `functions/`:
   * Added standalone `getKeeperFee`
   * Improved error handling
   * Added parameter validation
   * Updated transaction flow

3. Added test infrastructure:
   * Mock function support
   * Test cases for all operations
   * Validation testing
   * Error scenario testing

4. Updated documentation:
   * Comprehensive README
   * Usage examples
   * Parameter details
   * Best practices

## Ready for Review

- [x] All tests passing
- [x] Documentation complete
- [x] Code follows best practices
- [x] Error handling implemented
- [x] Parameter validation added

Available for any feedback or required changes. 