#!/usr/bin/env tsx
/**
 * direct-function-call.ts
 * 
 * This script provides a way to directly call any function defined in the tools.ts file.
 * It accepts command-line arguments to specify the function name and parameters.
 */

import dotenv from 'dotenv';
import { tools } from '../src/tools.js';
import { createWalletClient, createPublicClient, http, Hex, Address, TransactionReceipt } from 'viem';
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
    
    // Create a comprehensive options object with all required functions
    const functionOptions = {
        notify: async (message: string) => {
            console.log(`[Notify] ${message}`);
        },
        // Add getProvider function that returns the publicClient
        getProvider: (chainId: number) => {
            return publicClient;
        },
        // Add proper evm structure matching SDK expectations
        evm: {
            getProvider: (chainId: number) => {
                return publicClient;
            },
            sendTransactions: async (txs: any) => {
                if (!txs || !txs.transactions || txs.transactions.length === 0) {
                    console.error('[EVM-SendTx] No transactions provided.');
                    return { success: false, data: [], error: 'No transactions provided' };
                }
                
                // Define type for transaction responses
                type TxResponse = { hash: Hex; wait: () => Promise<any> };
                const transactionResponses: TxResponse[] = [];

                for (const txDetail of txs.transactions) {
                    try {
                        console.log(`[EVM-SendTx] Sending transaction to target ${txDetail.target} with data ${txDetail.data ? txDetail.data.substring(0, 20) : 'N/A'}...`);
                        
                        const hash = await walletClient.sendTransaction({
                            account: walletClient.account,
                            to: txDetail.target as Address,
                            data: txDetail.data as Hex,
                            value: txDetail.value ? BigInt(txDetail.value) : undefined,
                            chain: walletClient.chain, // Added chain
                        });
                        console.log(`[EVM-SendTx] Transaction sent with hash: ${hash}`);
                        transactionResponses.push({
                            hash: hash,
                            wait: async () => {
                                console.log(`[EVM-SendTx-Wait] Waiting for receipt for ${hash}...`);
                                let receipt: TransactionReceipt | null = null;
                                const maxRetries = 5;
                                const retryDelayMs = 3000; // 3 seconds
                                for (let i = 0; i < maxRetries; i++) {
                                    try {
                                        receipt = await publicClient.waitForTransactionReceipt({ hash });
                                        if (receipt) break; // Exit loop if receipt is found
                                    } catch (e: any) {
                                        if (i === maxRetries - 1) {
                                            console.error(`[EVM-SendTx-Wait] Failed to get receipt for ${hash} after ${maxRetries} retries:`, e.message);
                                            throw e; // Re-throw error after final attempt
                                        }
                                        console.log(`[EVM-SendTx-Wait] Receipt not found for ${hash} (attempt ${i + 1}/${maxRetries}), retrying in ${retryDelayMs / 1000}s...`);
                                        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
                                    }
                                }
                                if (!receipt) {
                                    throw new Error(`Transaction receipt for ${hash} not found after ${maxRetries} retries.`);
                                }
                                console.log(`[EVM-SendTx-Wait] Receipt status for ${hash}: ${receipt.status}`);
                                return receipt; 
                            }
                        });
                    } catch (error: any) {
                        console.error(`[EVM-SendTx] Error sending transaction:`, error);
                        // Return a structure that indicates individual failure if needed, or let it be part of a partial success
                        return { success: false, data: transactionResponses, error: error.message || 'Unknown EVM transaction error' };
                    }
                }
                return { success: true, data: transactionResponses };
            },
            signMessages: async (messages: any[]) => {
                console.log(`[SignMsg] Would sign ${messages.length} messages in production`);
                return messages.map(() => '0x0000000000000000000000000000000000000000000000000000000000000000');
            },
            signTypedDatas: async (args: any[]) => {
                console.log(`[SignTypedData] Would sign ${args.length} typed data in production`);
                return args.map(() => '0x0000000000000000000000000000000000000000000000000000000000000000');
            }
        },
        // Add solana structure required by SDK
        solana: {
            getConnection: () => {
                console.log(`[Solana] Would get connection in production`);
                return {} as any;
            },
            getPublicKey: async () => {
                console.log(`[Solana] Would get public key in production`);
                return {} as any;
            },
            sendTransactions: async () => {
                console.log(`[Solana] Would send transactions in production`);
                return { success: true, data: [] };
            },
            signTransactions: async () => {
                console.log(`[Solana] Would sign transactions in production`);
                return [];
            }
        },
        // Add ton structure required by SDK
        ton: {
            getAddress: async () => {
                console.log(`[TON] Would get address in production`);
                return {} as any;
            },
            getClient: async () => {
                console.log(`[TON] Would get client in production`);
                return {} as any;
            },
            sendTransactions: async () => {
                console.log(`[TON] Would send transactions in production`);
                return { success: true, data: [] };
            }
        },
        // Add sendTransactions for backward compatibility (This is likely the one used by removeLiquidity)
        sendTransactions: async (txs: any) => {
            if (!txs || !txs.transactions || txs.transactions.length === 0) {
                console.error('[Legacy-SendTx] No transactions provided.');
                return { success: false, data: [], error: 'No transactions provided' };
            }

            // Define type for transaction responses
            type TxResponse = { hash: Hex; wait: () => Promise<any> };
            const transactionResponses: TxResponse[] = [];

            for (const txDetail of txs.transactions) {
                 try {
                    console.log(`[Legacy-SendTx] Sending transaction to target ${txDetail.target} with data ${txDetail.data ? txDetail.data.substring(0, 20) : 'N/A'}...`);
                    
                    const hash = await walletClient.sendTransaction({
                        account: walletClient.account, 
                        to: txDetail.target as Address,
                        data: txDetail.data as Hex,
                        value: txDetail.value ? BigInt(txDetail.value) : undefined,
                        chain: walletClient.chain, // Added chain
                    });
                    console.log(`[Legacy-SendTx] Transaction sent with hash: ${hash}`);
                    transactionResponses.push({
                        hash: hash,
                        wait: async () => {
                            console.log(`[Legacy-SendTx-Wait] Waiting for receipt for ${hash}...`);
                            let receipt: TransactionReceipt | null = null;
                            const maxRetries = 5;
                            const retryDelayMs = 3000; // 3 seconds
                            for (let i = 0; i < maxRetries; i++) {
                                try {
                                    receipt = await publicClient.waitForTransactionReceipt({ hash });
                                    if (receipt) break; // Exit loop if receipt is found
                                } catch (e: any) {
                                    if (i === maxRetries - 1) {
                                        console.error(`[Legacy-SendTx-Wait] Failed to get receipt for ${hash} after ${maxRetries} retries:`, e.message);
                                        throw e; // Re-throw error after final attempt
                                    }
                                    console.log(`[Legacy-SendTx-Wait] Receipt not found for ${hash} (attempt ${i + 1}/${maxRetries}), retrying in ${retryDelayMs / 1000}s...`);
                                    await new Promise(resolve => setTimeout(resolve, retryDelayMs));
                                }
                            }
                            if (!receipt) {
                                throw new Error(`Transaction receipt for ${hash} not found after ${maxRetries} retries.`);
                            }
                            console.log(`[Legacy-SendTx-Wait] Receipt status for ${hash}: ${receipt.status}`);
                            return receipt;
                        }
                    });
                } catch (error: any) {
                    console.error(`[Legacy-SendTx] Error sending transaction:`, error);
                    return { success: false, data: transactionResponses, error: error.message || 'Unknown legacy transaction error' };
                }
            }
            return { success: true, data: transactionResponses };
        },
        // Add getRecipient function required by SDK
        getRecipient: async (type: string) => {
            console.log(`[GetRecipient] Would get recipient for ${type} in production`);
            return account.address;
        }
    };

    // Call the function with separate props and options arguments
    console.log("\n--- Function Execution Start ---");
    const result = await tool.function(functionProps, functionOptions);
    console.log("--- Function Execution End ---");

    console.log('\nResult:');
    const replacer = (key: any, value: any) => typeof value === 'bigint' ? value.toString() : value;
    // Attempt to parse and pretty-print if data is JSON string
    try {
      if (result.success && typeof result.data === 'string') {
          const jsonData = JSON.parse(result.data);
          console.log(JSON.stringify(jsonData, replacer, 2));
      } else {
          console.log(JSON.stringify(result, replacer, 2));
      }
    } catch (e) {
        // If parsing fails, print the raw result (potentially with BigInts, so use replacer)
        console.log(JSON.stringify(result, replacer, 2));
    }

    // --- BEGIN ADDED CODE FOR LIVE TRANSACTION SENDING ---
    if (result.success && result.data && typeof result.data === 'object' && !Array.isArray(result.data) && (result.data as any).target && (result.data as any).data) {
      console.log("\n--- Attempting to Send Transaction Live ---");
      try {
        const txParams = result.data as any; // Cast to any to access target, data, value
        // The sendTransactions function in functionOptions expects an object like { transactions: [txDetail] }
        // It also needs chainId and account for the top-level call to sendTransactions.
        // These are available from params.chainName and the derived wallet account.

        const txPayload = {
          chainId: CHAIN_CONFIG[params.chainName?.toLowerCase()]?.id,
          account: walletClient.account.address, // The account address
          transactions: [txParams] // Wrap the single tx in an array
        };

        if (!txPayload.chainId) {
            console.error("Critical: Could not determine chainId for sending transaction.");
            process.exit(1);
        }

        // Use the evm.sendTransactions for consistency if available,
        // otherwise fall back to the legacy sendTransactions if it matches the expected structure.
        let txReceipt;
        if (functionOptions.evm && typeof functionOptions.evm.sendTransactions === 'function') {
            console.log("Using evm.sendTransactions...");
            txReceipt = await functionOptions.evm.sendTransactions(txPayload);
        } else if (typeof functionOptions.sendTransactions === 'function') {
            console.log("Using legacy sendTransactions...");
            txReceipt = await functionOptions.sendTransactions(txPayload);
        } else {
            console.error("No suitable sendTransactions function found in functionOptions.");
            process.exit(1);
        }
        
        console.log("\n--- Live Transaction Result ---");
        if (txReceipt.success && txReceipt.data && txReceipt.data[0] && txReceipt.data[0].hash) {
            console.log("Transaction sent successfully!");
            console.log("Hash:", txReceipt.data[0].hash);
            console.log("Waiting for receipt...");
            const finalReceipt = await txReceipt.data[0].wait(); // wait() is part of the structure
            const replacer = (key, value) => typeof value === 'bigint' ? value.toString() : value;
            console.log("Receipt:", JSON.stringify(finalReceipt, replacer, 2));
        } else {
            console.error("Failed to send transaction or get hash.");
            const replacer = (key, value) => typeof value === 'bigint' ? value.toString() : value;
            console.log("Response:", JSON.stringify(txReceipt, replacer, 2));
        }
      } catch (sendError: any) {
        console.error("\nError sending transaction live:", sendError.message);
        if (sendError.stack) {
          console.error(sendError.stack);
        }
      }
    } else if (result.success && Array.isArray(result.data)) {
        console.log("\nTransaction parameters generated (array), but automatic sending for arrays is not implemented in this addition.");
    } else if (result.success) {
        console.log("\nTransaction parameters generated, but not in expected object format for automatic sending or no transaction to send.");
    }
    // --- END ADDED CODE FOR LIVE TRANSACTION SENDING ---
    
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
    
    // Special handling for Ethereum addresses - always keep as string
    if (typeof value === 'string' && value.startsWith('0x') && value.length === 42) {
      result[name] = value;
      continue;
    }
    
    // Try to parse value as JSON if it looks like a boolean, number, or JSON structure
    if (value.toLowerCase() === 'true') {
      value = true;
    } else if (value.toLowerCase() === 'false') {
      value = false;
    } else if (!isNaN(Number(value)) && value.trim() !== '') {
      // Skip number conversion for values that look like they might be addresses
      // even if they don't exactly match the 0x + 40 hex chars format
      if (!(typeof value === 'string' && value.startsWith('0x') && value.length > 10)) {
        value = Number(value);
      }
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