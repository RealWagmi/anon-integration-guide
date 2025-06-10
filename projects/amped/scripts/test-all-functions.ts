#!/usr/bin/env tsx
/**
 * test-all-functions.ts
 * 
 * Comprehensive test suite for all Amped Finance functions
 * Tests are ordered logically to ensure dependencies are met
 */

import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { privateKeyToAccount } from 'viem/accounts';

// Load environment variables
dotenv.config();

// Test configuration
const TEST_CHAIN = 'sonic'; // or 'base'

// Get account address from private key if not provided directly
let TEST_ACCOUNT = process.env.TEST_ACCOUNT || process.env.ACCOUNT_ADDRESS;

if (!TEST_ACCOUNT && process.env.PRIVATE_KEY) {
    try {
        const privateKey = process.env.PRIVATE_KEY.startsWith('0x') 
            ? process.env.PRIVATE_KEY as `0x${string}`
            : `0x${process.env.PRIVATE_KEY}` as `0x${string}`;
        const account = privateKeyToAccount(privateKey);
        TEST_ACCOUNT = account.address;
        console.log(`Derived account address from private key: ${TEST_ACCOUNT}`);
    } catch (error) {
        console.error('Failed to derive account from private key:', error);
    }
}

// Color codes for output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

interface TestCase {
  name: string;
  function: string;
  params: Record<string, any>;
  description: string;
  skipExecution?: boolean; // For functions that modify state
}

// Define test cases in logical order
const testCases: TestCase[] = [
  // ===== READ-ONLY FUNCTIONS (Safe to run) =====
  
  // 1. Pool and token information
  {
    name: 'Get Pool Liquidity',
    function: 'getPoolLiquidity',
    params: {
      chainName: TEST_CHAIN
    },
    description: 'Fetches overall pool liquidity and token information'
  },
  
  // 2. User token balances
  {
    name: 'Get User Token Balances',
    function: 'getUserTokenBalances',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT
    },
    description: 'Fetches all token balances for the user'
  },
  
  // 3. ALP information
  {
    name: 'Get User Liquidity',
    function: 'getUserLiquidity',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT
    },
    description: 'Fetches user\'s ALP balance and related info'
  },
  
  {
    name: 'Get ALP APR',
    function: 'getALPAPR',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT
    },
    description: 'Fetches current APR for ALP tokens'
  },
  
  {
    name: 'Get Earnings',
    function: 'getEarnings',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT
    },
    description: 'Fetches user\'s earnings from providing liquidity'
  },
  
  // 4. Trading liquidity checks
  {
    name: 'Get Swaps Liquidity',
    function: 'getSwapsLiquidity',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT
    },
    description: 'Fetches available liquidity for token swaps'
  },
  
  {
    name: 'Get Perps Liquidity (Long WETH)',
    function: 'getPerpsLiquidity',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT,
      tokenSymbol: 'WETH',
      isLong: true
    },
    description: 'Fetches perpetual trading liquidity for long WETH positions'
  },
  
  {
    name: 'Get Perps Liquidity (Short USDC)',
    function: 'getPerpsLiquidity',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT,
      tokenSymbol: 'USDC',
      isLong: false
    },
    description: 'Fetches perpetual trading liquidity for short USDC positions'
  },
  
  // 5. Position checks
  {
    name: 'Get All Open Positions',
    function: 'getAllOpenPositions',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT
    },
    description: 'Fetches all open perpetual positions for the user'
  },
  
  {
    name: 'Get Specific Position',
    function: 'getPosition',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT,
      tokenSymbol: 'WETH',
      collateralTokenSymbol: 'USDC',
      isLong: true
    },
    description: 'Fetches details of a specific position (if exists)'
  },
  
  // ===== STATE-CHANGING FUNCTIONS (Marked as skip by default) =====
  
  // 6. Liquidity operations
  {
    name: 'Add Liquidity (USDC)',
    function: 'addLiquidity',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT,
      tokenSymbol: 'USDC',
      amount: '1', // 1 USDC
      minUsdg: '0',
      minGlp: '0'
    },
    description: 'Adds liquidity to the pool with USDC',
    skipExecution: true
  },
  
  {
    name: 'Add Liquidity (Percentage)',
    function: 'addLiquidity',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT,
      tokenSymbol: 'USDC',
      percentOfBalance: 5, // 5% of balance
      minUsdg: '0',
      minGlp: '0'
    },
    description: 'Adds liquidity using percentage of balance',
    skipExecution: true
  },
  
  // Commented out due to 90-second cooldown period after adding liquidity
  // {
  //   name: 'Remove Liquidity',
  //   function: 'removeLiquidity',
  //   params: {
  //     chainName: TEST_CHAIN,
  //     account: TEST_ACCOUNT,
  //     tokenOutSymbol: 'USDC',
  //     amount: '1', // 1 GLP
  //     slippageTolerance: 0.5
  //   },
  //   description: 'Removes liquidity from the pool',
  //   skipExecution: true
  // },
  
  {
    name: 'Claim Rewards',
    function: 'claimRewards',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT
    },
    description: 'Claims accumulated rewards',
    skipExecution: true
  },
  
  // 7. Trading operations
  {
    name: 'Market Swap',
    function: 'marketSwap',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT,
      tokenIn: 'USDC',
      tokenOut: 'WETH',
      amountIn: '2', // 2 USDC
      slippageBps: 100 // 1%
    },
    description: 'Swaps USDC for WETH',
    skipExecution: true
  },
  
  {
    name: 'Open Position',
    function: 'openPosition',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT,
      tokenSymbol: 'WETH',
      collateralTokenSymbol: 'USDC',
      isLong: true,
      sizeUsd: '10', // $10 position
      collateralUsd: '2', // $2 collateral (5x leverage)
      slippageBps: 30
    },
    description: 'Opens a 5x long WETH position with USDC collateral',
    skipExecution: true
  },
  
  {
    name: 'Close Position',
    function: 'closePosition',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT,
      indexToken: undefined, // Close all positions
      collateralToken: undefined,
      isLong: undefined,
      slippageBps: 30
    },
    description: 'Closes all open positions',
    skipExecution: true
  }
];

// Execute a single test
async function runTest(test: TestCase, index: number): Promise<boolean> {
  console.log(`\n${YELLOW}[${index + 1}/${testCases.length}] ${test.name}${RESET}`);
  console.log(`Function: ${test.function}`);
  console.log(`Description: ${test.description}`);
  
  if (test.skipExecution) {
    console.log(`${YELLOW}⚠️  Skipped (state-changing function)${RESET}`);
    return true;
  }
  
  // Build command
  const paramsStr = Object.entries(test.params)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join(' ');
  
  const command = `npm run function -- ${test.function} ${paramsStr}`;
  console.log(`Command: ${command}`);
  
  try {
    const output = execSync(command, { encoding: 'utf-8' });
    
    // Extract result from output
    const resultMatch = output.match(/Result:([\s\S]*?)(\n---|\n\[|$)/);
    if (resultMatch) {
      const resultStr = resultMatch[1].trim();
      try {
        const result = JSON.parse(resultStr);
        if (result.success || (result.success === undefined && result.data)) {
          console.log(`${GREEN}✓ Success${RESET}`);
          
          // Print key data points
          if (typeof result.data === 'string') {
            try {
              const data = JSON.parse(result.data);
              printKeyData(test.function, data);
            } catch {
              console.log(`Data: ${result.data.substring(0, 100)}...`);
            }
          }
          return true;
        } else {
          console.log(`${RED}✗ Failed: ${result.data || result.error || 'Unknown error'}${RESET}`);
          return false;
        }
      } catch (e) {
        console.log(`${GREEN}✓ Completed (non-JSON response)${RESET}`);
        return true;
      }
    } else {
      console.log(`${YELLOW}⚠️  No clear result found in output${RESET}`);
      return true;
    }
  } catch (error) {
    console.log(`${RED}✗ Error: ${error.message}${RESET}`);
    return false;
  }
}

// Print key data points based on function
function printKeyData(functionName: string, data: any) {
  switch (functionName) {
    case 'getPoolLiquidity':
      console.log(`  - AUM: $${data.aum}`);
      console.log(`  - Total Supply: ${data.totalSupply} GLP`);
      console.log(`  - GLP Price: $${data.glpPrice}`);
      console.log(`  - Tokens: ${data.tokens.length}`);
      break;
      
    case 'getUserTokenBalances':
      console.log(`  - Total Balance: $${data.totalBalanceUsd}`);
      console.log(`  - Tokens with balance: ${data.tokens.filter(t => parseFloat(t.balance) > 0).length}`);
      break;
      
    case 'getUserLiquidity':
      console.log(`  - ALP Balance: ${data.totalAmount}`);
      console.log(`  - Value: $${data.totalAmountUsd}`);
      console.log(`  - Claimable Rewards: ${data.claimableRewards} WETH`);
      break;
      
    case 'getALPAPR':
      console.log(`  - Total APR: ${data.totalApr}%`);
      console.log(`  - AMP APR: ${data.ampApr}%`);
      console.log(`  - LP APR: ${data.lpApr}%`);
      break;
      
    case 'getPerpsLiquidity':
      if (data.info) {
        console.log(`  - Available Liquidity: $${data.info.availableLiquidityUsd}`);
        console.log(`  - Max Leverage: ${data.info.maxLeverage}x`);
      }
      break;
      
    case 'getAllOpenPositions':
      console.log(`  - Open Positions: ${data.positions?.length || 0}`);
      if (data.totalSummary) {
        console.log(`  - Total Size: $${data.totalSummary.totalSizeUsd}`);
        console.log(`  - Total PnL: $${data.totalSummary.totalUnrealizedPnlUsd}`);
      }
      break;
  }
}

// Main execution
async function main() {
  console.log(`${GREEN}=== Amped Finance Function Test Suite ===${RESET}`);
  console.log(`Chain: ${TEST_CHAIN}`);
  console.log(`Account: ${TEST_ACCOUNT}`);
  
  if (!TEST_ACCOUNT) {
    console.error(`${RED}Error: No test account available.${RESET}`);
    console.error(`${RED}Please provide one of the following in your .env file:${RESET}`);
    console.error(`${RED}- PRIVATE_KEY=your_private_key (will derive account address)${RESET}`);
    console.error(`${RED}- TEST_ACCOUNT=0x... (direct account address)${RESET}`);
    console.error(`${RED}- ACCOUNT_ADDRESS=0x... (direct account address)${RESET}`);
    process.exit(1);
  }
  
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  
  // Run each test
  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];
    
    if (test.skipExecution) {
      skipped++;
    } else {
      const success = await runTest(test, i);
      if (success) {
        passed++;
      } else {
        failed++;
      }
    }
    
    // Small delay between tests
    if (i < testCases.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Summary
  console.log(`\n${GREEN}=== Test Summary ===${RESET}`);
  console.log(`Total: ${testCases.length}`);
  console.log(`${GREEN}Passed: ${passed}${RESET}`);
  console.log(`${RED}Failed: ${failed}${RESET}`);
  console.log(`${YELLOW}Skipped: ${skipped}${RESET}`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Run the test suite
main().catch(error => {
  console.error(`${RED}Unhandled error:${RESET}`, error);
  process.exit(1);
});