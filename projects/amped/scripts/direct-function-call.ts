#!/usr/bin/env tsx
/**
 * direct-function-call.ts
 * 
 * This script provides a way to directly call any function defined in the tools.ts file.
 * It accepts command-line arguments to specify the function name and parameters.
 */

import dotenv from 'dotenv';
import { tools } from '../src/tools.js';
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CHAIN_CONFIG } from '../src/constants.js';

// Load environment variables
dotenv.config();

// Get private key from environment variables
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error('Error: PRIVATE_KEY not found in environment variables');
  process.exit(1);
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    printUsage();
    process.exit(0);
  }

  const functionName = args[0];
  let paramsStr = args.slice(1).join(' ');

  // Find the requested function in the tools array
  const tool = tools.find(t => t.name === functionName);
  
  if (!tool) {
    console.error(`Error: Function "${functionName}" not found`);
    console.log('Available functions:');
    tools.forEach(t => console.log(`- ${t.name}`));
    process.exit(1);
  }

  // If no parameters were provided but some are required, show the required parameters
  if (!paramsStr && tool.required.length > 0) {
    console.log(`Function "${functionName}" requires the following parameters:`);
    tool.props.forEach(param => {
      const isRequired = tool.required.includes(param.name);
      console.log(`- ${param.name}${isRequired ? ' (required)' : ''}: ${param.description}`);
      if (param.enum) {
        console.log(`  Allowed values: ${param.enum.join(', ')}`);
      }
    });
    process.exit(0);
  }

  // Parse parameters
  let params = parseParams(args);
  
  // If account parameter is needed but not provided, use the account from private key
  if (tool.required.includes('account') && !params.account) {
    const account = privateKeyToAccount(`0x${privateKey}`);
    params.account = account.address;
    console.log(`Using account address from private key: ${account.address}`);
  }

  // Check required params
  const missingParams = tool.required.filter(param => !(param in params));
  if (missingParams.length > 0) {
    console.error(`Error: Missing required parameters: ${missingParams.join(', ')}`);
    process.exit(1);
  }

  console.log(`Calling function "${functionName}" with parameters:`, params);
  
  try {
    // Setup chain config
    const chainName = params.chainName;
    const chainConfig = CHAIN_CONFIG[chainName?.toLowerCase()]; // Added optional chaining
    
    if (!chainConfig) {
      console.error(`Error: Chain "${chainName}" not supported or chainName missing`);
      process.exit(1);
    }

    // Create public client
    const publicClient = createPublicClient({
      chain: chainConfig,
      transport: http(chainConfig.rpcUrls.default.http[0])
    });

    // Create wallet client
    const account = privateKeyToAccount(`0x${privateKey}`);
    const walletClient = createWalletClient({
      account,
      chain: chainConfig,
      transport: http(chainConfig.rpcUrls.default.http[0])
    });

    // Prepare the props object for the function (first argument)
    const functionProps = {
      ...params,
      publicClient,
      walletClient,
    };
    
    // Create a simplified options object with just notify (second argument)
    const functionOptions = {
        notify: async (message: string) => {
            console.log(`[Notify] ${message}`);
        },
        // Removed placeholders for getProvider and sendTransactions
    };

    // Call the function with separate props and options arguments
    console.log("\n--- Function Execution Start ---");
    const result = await tool.function(functionProps, functionOptions);
    console.log("--- Function Execution End ---");

    console.log('\nResult:');
    // Attempt to parse and pretty-print if data is JSON string
    try {
      if (result.success && typeof result.data === 'string') {
          const jsonData = JSON.parse(result.data);
          console.log(JSON.stringify(jsonData, null, 2));
      } else {
          console.log(result);
      }
    } catch (e) {
        // If parsing fails, print the raw result
        console.log(result);
    }
    
  } catch (error) {
    console.error('\nError executing function:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Renamed helper function for clarity
function parseParams(args: string[]) {
  let paramsStr = args.slice(1).join(' ');
  let params;
  try {
    if (paramsStr && !paramsStr.trim().startsWith('{')) {
      params = parseKeyValuePairs(args.slice(1));
    } else {
      params = paramsStr ? JSON.parse(paramsStr) : {};
    }
  } catch (error) {
    console.error('Error parsing parameters:', error.message);
    console.log('Parameters should be in either JSON format or name=value pairs');
    process.exit(1);
  }
  return params;
}

// Helper function to parse key-value pairs from command line arguments
function parseKeyValuePairs(args) {
  const result = {};
  
  for (const arg of args) {
    // Skip if doesn't match name=value pattern
    if (!arg.includes('=')) continue;
    
    const [name, ...valueParts] = arg.split('=');
    let value = valueParts.join('='); // Rejoin in case value itself contains =
    
    // Try to parse value as JSON if it looks like a boolean, number, or JSON structure
    if (value.toLowerCase() === 'true') {
      value = true;
    } else if (value.toLowerCase() === 'false') {
      value = false;
    } else if (!isNaN(Number(value)) && value.trim() !== '') {
      value = Number(value);
    } else if ((value.startsWith('{') && value.endsWith('}')) || 
               (value.startsWith('[') && value.endsWith(']'))) {
      try {
        value = JSON.parse(value);
      } catch {
        // If parse fails, keep as string
      }
    }
    
    result[name] = value;
  }
  
  return result;
}

// Print usage information
function printUsage() {
  console.log('Usage: npm run function -- <functionName> [parameters]');
  console.log('');
  console.log('Parameters can be provided in two formats:');
  console.log('1. As JSON: npm run function -- functionName \'{"param1": "value1", "param2": 123}\'');
  console.log('2. As key-value pairs: npm run function -- functionName param1=value1 param2=123');
  console.log('');
  console.log('Available functions:');
  tools.forEach(tool => {
    console.log(`- ${tool.name}: ${tool.description}`);
  });
  console.log('');
  console.log('For detailed parameter information, run the command with just the function name:');
  console.log('npm run function -- functionName');
}

// Execute the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});