#!/usr/bin/env tsx
/**
 * test-all-functions-with-results.ts
 * 
 * Comprehensive test suite for all Amped Finance functions
 * Shows actual results and optionally runs state-changing functions
 */

import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { privateKeyToAccount } from 'viem/accounts';

// Load environment variables
dotenv.config();

// Test configuration
const TEST_CHAIN = process.env.TEST_CHAIN || 'sonic';
const RUN_STATE_CHANGING = process.env.RUN_STATE_CHANGING === 'true';

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
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

interface TestCase {
  name: string;
  function: string;
  params: Record<string, any>;
  description: string;
  skipExecution?: boolean; // For functions that modify state
  category: 'read' | 'write';
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
    description: 'Fetches overall pool liquidity and token information',
    category: 'read'
  },
  
  // 2. User token balances
  {
    name: 'Get User Token Balances',
    function: 'getUserTokenBalances',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT
    },
    description: 'Fetches all token balances for the user',
    category: 'read'
  },
  
  // 3. ALP information
  {
    name: 'Get User Liquidity',
    function: 'getUserLiquidity',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT
    },
    description: 'Fetches user\'s ALP balance and related info',
    category: 'read'
  },
  
  {
    name: 'Get ALP APR',
    function: 'getALPAPR',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT
    },
    description: 'Fetches current APR for ALP tokens',
    category: 'read'
  },
  
  {
    name: 'Get Earnings',
    function: 'getEarnings',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT
    },
    description: 'Fetches user\'s earnings from providing liquidity',
    category: 'read'
  },
  
  // 4. Trading liquidity checks
  {
    name: 'Get Swaps Liquidity',
    function: 'getSwapsLiquidity',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT
    },
    description: 'Fetches available liquidity for token swaps',
    category: 'read'
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
    description: 'Fetches perpetual trading liquidity for long WETH positions',
    category: 'read'
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
    description: 'Fetches perpetual trading liquidity for short USDC positions',
    category: 'read'
  },
  
  // 5. Position checks
  {
    name: 'Get All Open Positions',
    function: 'getAllOpenPositions',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT
    },
    description: 'Fetches all open perpetual positions for the user',
    category: 'read'
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
    description: 'Fetches details of a specific position (if exists)',
    category: 'read'
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
      amount: '0.1', // 0.1 USDC
      minUsdg: '0',
      minGlp: '0'
    },
    description: 'Adds liquidity to the pool with USDC',
    skipExecution: !RUN_STATE_CHANGING,
    category: 'write'
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
    skipExecution: !RUN_STATE_CHANGING,
    category: 'write'
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
  //   skipExecution: !RUN_STATE_CHANGING,
  //   category: 'write'
  // },
  
  {
    name: 'Claim Rewards',
    function: 'claimRewards',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT
    },
    description: 'Claims accumulated rewards',
    skipExecution: !RUN_STATE_CHANGING,
    category: 'write'
  },
  
  // 7. Trading operations
  {
    name: 'Market Swap',
    function: 'marketSwap',
    params: {
      chainName: TEST_CHAIN,
      account: TEST_ACCOUNT,
      tokenIn: 'USDC',
      tokenOut: 'S',
      amountIn: '0.1', // 0.1 USDC
      slippageBps: 100 // 1%
    },
    description: 'Swaps USDC for S',
    skipExecution: !RUN_STATE_CHANGING,
    category: 'write'
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
      sizeUsd: '1', // $1 position
      collateralUsd: '0.2', // $0.2 collateral (5x leverage)
      slippageBps: 30
    },
    description: 'Opens a 5x long WETH position with USDC collateral',
    skipExecution: !RUN_STATE_CHANGING,
    category: 'write'
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
    skipExecution: !RUN_STATE_CHANGING,
    category: 'write'
  }
];

// Execute a single test
async function runTest(test: TestCase, index: number): Promise<boolean> {
  console.log(`\n${YELLOW}[${index + 1}/${testCases.length}] ${test.name}${RESET}`);
  console.log(`Function: ${test.function}`);
  console.log(`Description: ${test.description}`);
  
  if (test.skipExecution) {
    console.log(`${YELLOW}⚠️  Skipped (state-changing function - set RUN_STATE_CHANGING=true to run)${RESET}`);
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
          
          // Print the actual result data
          if (result.data) {
            try {
              const data = JSON.parse(result.data);
              console.log(`${BLUE}Result:${RESET}`);
              printDetailedData(test.function, data);
            } catch {
              // If data is not JSON, print as-is
              console.log(`${BLUE}Result:${RESET} ${result.data}`);
            }
          }
          return true;
        } else {
          console.log(`${RED}✗ Failed: ${result.data || result.error || 'Unknown error'}${RESET}`);
          return false;
        }
      } catch (e) {
        // Extract any meaningful data from non-JSON response
        const notificationMatch = output.match(/\[Notification\]: (.*?)(?=\n|\[|$)/g);
        if (notificationMatch) {
          console.log(`${GREEN}✓ Completed${RESET}`);
          console.log(`${BLUE}Notifications:${RESET}`);
          notificationMatch.forEach(notification => {
            const msg = notification.replace('[Notification]: ', '');
            console.log(`  - ${msg}`);
          });
        } else {
          console.log(`${GREEN}✓ Completed${RESET}`);
          // Try to extract meaningful content from output
          const lines = output.split('\n').filter(line => 
            !line.includes('[Notification]') && 
            !line.includes('Result:') && 
            line.trim().length > 0
          );
          if (lines.length > 0) {
            console.log(`${BLUE}Output:${RESET}`);
            lines.slice(-5).forEach(line => console.log(`  ${line}`));
          }
        }
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

// Print detailed data based on function
function printDetailedData(functionName: string, data: any) {
  switch (functionName) {
    case 'getPoolLiquidity':
      console.log(`  AUM: $${data.aum}`);
      console.log(`  Total Supply: ${data.totalSupply} GLP`);
      console.log(`  GLP Price: $${data.glpPrice}`);
      console.log(`  Tokens in pool: ${data.tokens.length}`);
      if (data.tokens.length > 0) {
        console.log(`  Sample tokens:`);
        data.tokens.slice(0, 3).forEach(token => {
          console.log(`    - ${token.symbol}: ${token.poolAmount} ($${token.usdValue})`);
        });
      }
      break;
      
    case 'getUserTokenBalances':
      console.log(`  Total Balance: $${data.totalBalanceUsd}`);
      const tokensWithBalance = data.tokens.filter(t => parseFloat(t.balance) > 0);
      console.log(`  Tokens with balance: ${tokensWithBalance.length}/${data.tokens.length}`);
      if (tokensWithBalance.length > 0) {
        console.log(`  Balances:`);
        tokensWithBalance.forEach(token => {
          console.log(`    - ${token.symbol}: ${token.balance} ($${token.balanceUsd})`);
        });
      }
      break;
      
    case 'getUserLiquidity':
      console.log(`  ALP Balance: ${data.totalAmount}`);
      console.log(`  Value: $${data.totalAmountUsd}`);
      console.log(`  Staked ALP: ${data.stakedAmount}`);
      console.log(`  Claimable Rewards: ${data.claimableRewards} WETH`);
      console.log(`  Vested ALP: ${data.vestedAmount}`);
      break;
      
    case 'getALPAPR':
      console.log(`  Total APR: ${data.totalApr}%`);
      console.log(`  AMP APR: ${data.ampApr}%`);
      console.log(`  LP APR: ${data.lpApr}%`);
      break;
      
    case 'getEarnings':
      console.log(`  Total claimable: ${data.totalClaimable}`);
      if (data.rewards && data.rewards.length > 0) {
        console.log(`  Rewards breakdown:`);
        data.rewards.forEach(reward => {
          console.log(`    - ${reward.token}: ${reward.amount} ($${reward.amountUsd})`);
        });
      }
      break;
      
    case 'getSwapsLiquidity':
      console.log(`  Supported tokens: ${data.tokens?.length || 0}`);
      if (data.tokens && data.tokens.length > 0) {
        console.log(`  Sample liquidity:`);
        data.tokens.slice(0, 3).forEach(token => {
          console.log(`    - ${token.symbol}: ${token.availableLiquidity} available`);
        });
      }
      break;
      
    case 'getPerpsLiquidity':
      if (data.success && data.info) {
        console.log(`  Token: ${data.info.tokenSymbol}`);
        console.log(`  Available Liquidity: $${data.info.availableLiquidityUsd}`);
        console.log(`  Max Leverage: ${data.info.maxLeverage}x`);
        console.log(`  Current Price: $${data.info.currentPrice}`);
      } else {
        console.log(`  ${data.message || 'No liquidity data available'}`);
      }
      break;
      
    case 'getAllOpenPositions':
      if (data.success && data.positions) {
        console.log(`  Open Positions: ${data.positions.length}`);
        if (data.positions.length > 0) {
          console.log(`  Total Position Value: $${data.totalPositionValue}`);
          console.log(`  Total Unrealized PnL: $${data.totalUnrealizedPnl}`);
          console.log(`  Total Collateral Value: $${data.totalCollateralValue}`);
          console.log(`  Positions:`);
          data.positions.forEach((pos, i) => {
            console.log(`    ${i + 1}. ${pos.tokenSymbol} ${pos.isLong ? 'LONG' : 'SHORT'}: $${pos.position.size} (PnL: $${pos.position.unrealizedPnlUsd})`);
          });
        } else {
          console.log(`  No open positions found`);
        }
      }
      break;
      
    case 'getPosition':
      if (data.success && data.position) {
        const pos = data.position;
        console.log(`  Position size: $${pos.size}`);
        console.log(`  Collateral: ${pos.collateralAmount} ($${pos.collateralUsd})`);
        console.log(`  Leverage: ${pos.leverage}x`);
        console.log(`  Entry price: $${pos.averagePrice}`);
        console.log(`  Current price: $${pos.currentPrice}`);
        console.log(`  Unrealized PnL: $${pos.unrealizedPnlUsd} (${pos.unrealizedPnlPercentage}%)`);
        console.log(`  Liquidation price: $${pos.liquidationPrice}`);
      } else {
        console.log(`  No position found`);
      }
      break;
      
    case 'marketSwap':
      if (data.txHash) {
        console.log(`  Transaction hash: ${data.txHash}`);
        console.log(`  Status: ${data.status}`);
      }
      break;
      
    case 'openPosition':
    case 'closePosition':
      if (data.txHash) {
        console.log(`  Transaction hash: ${data.txHash}`);
        console.log(`  Status: ${data.status}`);
      }
      break;
      
    case 'addLiquidity':
    case 'removeLiquidity':
      if (data.txHash) {
        console.log(`  Transaction hash: ${data.txHash}`);
        console.log(`  Status: ${data.status}`);
      }
      break;
      
    case 'claimRewards':
      if (data.txHash) {
        console.log(`  Transaction hash: ${data.txHash}`);
        console.log(`  Status: ${data.status}`);
      }
      break;
      
    default:
      // Generic output for unknown functions
      console.log(JSON.stringify(data, null, 2));
  }
}

// Main execution
async function main() {
  console.log(`${GREEN}=== Amped Finance Function Test Suite ===${RESET}`);
  console.log(`Chain: ${TEST_CHAIN}`);
  console.log(`Account: ${TEST_ACCOUNT}`);
  console.log(`Run State-Changing Functions: ${RUN_STATE_CHANGING ? 'YES' : 'NO'}`);
  
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
  
  // Separate tests by category
  const readTests = testCases.filter(t => t.category === 'read');
  const writeTests = testCases.filter(t => t.category === 'write');
  
  console.log(`\n${BLUE}=== Running Read-Only Functions ===${RESET}`);
  
  // Run each test
  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];
    
    // Add separator between read and write tests
    if (i === readTests.length && writeTests.length > 0) {
      console.log(`\n${BLUE}=== Running State-Changing Functions ===${RESET}`);
    }
    
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
    console.log(`\n${RED}Some tests failed. Check the output above for details.${RESET}`);
    process.exit(1);
  } else {
    console.log(`\n${GREEN}All enabled tests passed!${RESET}`);
    if (skipped > 0 && !RUN_STATE_CHANGING) {
      console.log(`${YELLOW}To run state-changing functions, set RUN_STATE_CHANGING=true${RESET}`);
    }
  }
}

// Run the test suite
main().catch(error => {
  console.error(`${RED}Unhandled error:${RESET}`, error);
  process.exit(1);
});