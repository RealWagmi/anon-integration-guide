import { FunctionReturn, FunctionOptions, TransactionReturn } from '@heyanon/sdk';
import { getSupportedChains } from './functions/getSupportedChains';
import { getTokenInfo } from './functions/getTokenInfo';
import { getBridgeQuote } from './functions/getBridgeQuote';
import { executeBridgeTransaction, Props as ExecuteBridgeProps } from './functions/executeBridgeTransaction';
import { checkTransactionStatus } from './functions/checkTransactionStatus';
import { Address } from 'viem';

// Mock FunctionOptions
const mockOptions: FunctionOptions = {
    notify: async (message: string) => console.log('Notification:', message),
    sendTransactions: async () => ({ 
        success: true, 
        data: [{ 
            hash: '0x1234567890abcdef' as `0x${string}`,
            message: 'Transaction executed successfully'
        }], 
        isMultisig: false 
    } as TransactionReturn),
    getProvider: () => ({} as any)
};

// Test getSupportedChains function
async function testGetSupportedChains(): Promise<boolean> {
    console.log('\nTesting getSupportedChains...');
    
    try {
        const result = await getSupportedChains({}, mockOptions);
        
        // Check if result is successful
        if (!result.success) {
            console.error('❌ getSupportedChains failed:', result.data);
            return false;
        }

        // Check if result contains expected data format
        if (typeof result.data !== 'string' || !result.data.includes('Supported chains:')) {
            console.error('❌ getSupportedChains: Unexpected response format');
            return false;
        }

        // Check if common chains are included
        const response = result.data.toLowerCase();
        const expectedChains = ['ethereum', 'arbitrum', 'optimism', 'bsc'];
        const missingChains = expectedChains.filter(chain => !response.includes(chain));

        if (missingChains.length > 0) {
            console.error(`❌ getSupportedChains: Missing expected chains: ${missingChains.join(', ')}`);
            return false;
        }

        console.log('✅ getSupportedChains test passed');
        console.log('Response:', result.data);
        return true;
    } catch (error) {
        console.error('❌ getSupportedChains test error:', error);
        return false;
    }
}

// Test getTokenInfo function for Ethereum tokens
async function testGetTokenInfo(): Promise<boolean> {
    console.log('\nTesting getTokenInfo...');
    
    try {
        // Test 1: Getting Ethereum token list
        console.log('\nTest 1: Ethereum Token List');
        const ethResult = await getTokenInfo({ chainId: '1' }, mockOptions);
        
        // Check if result is successful
        if (!ethResult.success) {
            console.error('❌ getTokenInfo (ETH) failed:', ethResult.data);
            return false;
        }

        // Check if result contains token information
        if (typeof ethResult.data !== 'string' || !ethResult.data.includes('Found')) {
            console.error('❌ getTokenInfo (ETH): Unexpected response format');
            return false;
        }

        // Check for common tokens (USDT, USDC, WETH)
        const ethResponse = ethResult.data.toLowerCase();
        const expectedTokens = ['usdt', 'usdc', 'weth'];
        const missingTokens = expectedTokens.filter(token => !ethResponse.includes(token));

        if (missingTokens.length > 0) {
            console.error(`❌ getTokenInfo (ETH): Missing expected tokens: ${missingTokens.join(', ')}`);
            return false;
        }

        console.log('✅ Ethereum token list test passed');
        console.log('Response:', ethResult.data);

        // Test 2: Getting DBR token on Solana
        console.log('\nTest 2: DBR Token on Solana');
        const dbrResult = await getTokenInfo({ 
            chainId: '7565164',
            tokenAddress: 'DBRiDgJAMsM95moTzJs7M9LnkGErpbv9v6CUR1DXnUu5'
        }, mockOptions);

        if (!dbrResult.success) {
            console.error('❌ getTokenInfo (DBR) failed:', dbrResult.data);
            return false;
        }

        const dbrResponse = dbrResult.data.toLowerCase();
        if (!dbrResponse.includes('dbr') || !dbrResponse.includes('dbridgjamsm95motzjs7m9lnkgerpbv9v6cur1dxnuu5')) {
            console.error('❌ getTokenInfo (DBR): DBR token not found or incorrect address');
            return false;
        }

        console.log('✅ DBR token test passed');
        console.log('Response:', dbrResult.data);

        return true;
    } catch (error) {
        console.error('❌ getTokenInfo test error:', error);
        return false;
    }
}

// Test getBridgeQuote function
async function testGetBridgeQuote(): Promise<boolean> {
    console.log('\nTesting getBridgeQuote...');
    
    try {
        // Test 1: Cross-chain quote (Base -> Solana DBR)
        console.log('\nTest: Base -> Solana DBR Bridge Quote');
        const mockWallet = '0xefab75b7b199bf8512e2d5b379374cb94dfdba47' as Address;
        const solanaRecipient = 'Abws588GagNKeMViBPE2e1WjQ2jViDyw81ZRq8oMSx75' as Address;
        const baseToSolanaResult = await getBridgeQuote({
            srcChainId: '8453', // Base
            srcChainTokenIn: '0x0000000000000000000000000000000000000000', // ETH on Base
            srcChainTokenInAmount: '5000000000000000000', // 5 ETH (18 decimals)
            dstChainId: '7565164', // Solana
            dstChainTokenOut: 'DBRiDgJAMsM95moTzJs7M9LnkGErpbv9v6CUR1DXnUu5', // DBR on Solana
            account: mockWallet,
            recipient: solanaRecipient,
            slippage: '0.8', // 0.8% slippage as recommended in the example
            prependOperatingExpenses: true
        }, mockOptions);

        if (!baseToSolanaResult.success) {
            console.error('❌ getBridgeQuote (Base -> Solana) failed:', baseToSolanaResult.data);
            return false;
        }

        console.log('✅ Base -> Solana bridge quote test passed');
        console.log('Response:', baseToSolanaResult.data);

        // Test 2: Base ETH -> USDbC Same Chain Swap
        console.log('\nTest: Base ETH -> USDbC Same Chain Swap');
        const baseToUsdbcResult = await getBridgeQuote({
            srcChainId: '8453',
            srcChainTokenIn: '0x0000000000000000000000000000000000000000',
            srcChainTokenInAmount: '28583000000000000',
            dstChainId: '8453',
            dstChainTokenOut: '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca',
            account: '0xefab75b7b199bf8512e2d5b379374cb94dfdba47',
            recipient: '0xefab75b7b199bf8512e2d5b379374cb94dfdba47',
        }, mockOptions);

        if (!baseToUsdbcResult.success) {
            console.error('❌ getBridgeQuote (Base ETH -> USDbC) failed:', baseToUsdbcResult.data);
            return false;
        }

        console.log('✅ Base ETH -> USDbC same chain swap test passed');
        console.log('Response:', baseToUsdbcResult.data);

        return true;
    } catch (error) {
        console.error('❌ getBridgeQuote test error:', error);
        return false;
    }
}

// Test executeBridgeTransaction function
async function testExecuteBridgeTransaction(): Promise<boolean> {
    console.log('\nTesting executeBridgeTransaction...\n');
    const mockWallet = '0xefab75b7b199bf8512e2d5b379374cb94dfdba47' as Address;

    try {
        // Test 1: Execute same-chain swap (Base ETH -> USDbC)
        console.log('Test: Execute Base ETH -> USDbC Same Chain Swap');
        await mockOptions.notify('Executing same chain swap...');
        const sameChainResult = await executeBridgeTransaction({
            chainId: '8453',
            account: mockWallet,
            transactionData: {
                target: '0x0000000000001ff3684f28c67538d4d072c22734' as `0x${string}`,
                data: '0x2213bc0b000000000000000000000000bc3c5ca50b6a215edf00815965485527f26f5da8' as `0x${string}`,
                value: BigInt('28583000000000000')
            }
        } as ExecuteBridgeProps, mockOptions);

        if (!sameChainResult.success) {
            console.error('❌ Same chain execution test failed:', JSON.stringify(sameChainResult.data));
            return false;
        }

        console.log('✅ Same chain execution test passed');
        console.log('Response:', sameChainResult.data);

        // Test 2: Execute cross-chain bridge (Base ETH -> Solana DBR)
        console.log('\nTest: Execute Base ETH -> Solana DBR Cross Chain Bridge');
        await mockOptions.notify('Executing cross chain bridge...');
        const crossChainResult = await executeBridgeTransaction({
            chainId: '8453',
            account: mockWallet,
            transactionData: {
                target: '0x663DC15D3C1aC63ff12E45Ab68FeA3F0a883C251' as `0x${string}`,
                data: '0x2213bc0b000000000000000000000000bc3c5ca50b6a215edf00815965485527f26f5da8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000658c16499d7000000000000000000000000000bc3c5ca50b6a215edf00815965485527f26f5da800000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000004241fff991f000000000000000000000000efab75b7b199bf8512e2d5b379374cb94dfdba47' as `0x${string}`,
                value: BigInt('5000000000000000000')
            }
        } as ExecuteBridgeProps, mockOptions);

        if (!crossChainResult.success) {
            console.error('❌ Cross chain execution test failed:', JSON.stringify(crossChainResult.data));
            return false;
        }

        console.log('✅ Cross chain execution test passed');
        console.log('Response:', crossChainResult.data);
        return true;
    } catch (error) {
        console.error('❌ executeBridgeTransaction test error:', error);
        return false;
    }
}

// Test checkTransactionStatus function
async function testCheckTransactionStatus(): Promise<boolean> {
    console.log('\nTesting checkTransactionStatus...');

    try {
        // Test: Check status of a specific transaction
        console.log('\nTest: Check status of a specific transaction');
        await mockOptions.notify('Checking transaction status...');
        
        const txHash = '0x19fa026c3c061aee096f90f1240bc67b88562a1115bf9ef1afb0e5dc27017ece';
        const result = await checkTransactionStatus({ txHash }, mockOptions);

        if (!result.success) {
            console.error('❌ Transaction status check failed:', result.data);
            return false;
        }

        console.log('✅ Transaction status check passed');
        console.log('Response:', result.data);
        return true;
    } catch (error) {
        console.error('❌ checkTransactionStatus test error:', error);
        return false;
    }
}

// Main test runner
async function runTests() {
    console.log('Starting deBridge module tests...\n');
    
    let passedTests = 0;
    let totalTests = 0;

    // Test getSupportedChains
    totalTests++;
    if (await testGetSupportedChains()) {
        passedTests++;
    }

    // Test getTokenInfo
    totalTests++;
    if (await testGetTokenInfo()) {
        passedTests++;
    }

    // Test getBridgeQuote
    totalTests++;
    if (await testGetBridgeQuote()) {
        passedTests++;
    }

    // Test executeBridgeTransaction
    totalTests++;
    if (await testExecuteBridgeTransaction()) {
        passedTests++;
    }

    // Test checkTransactionStatus
    totalTests++;
    if (await testCheckTransactionStatus()) {
        passedTests++;
    }

    // Print summary
    console.log('\nTest Summary:');
    console.log(`Passed: ${passedTests}/${totalTests} tests`);
    console.log(`Success Rate: ${(passedTests/totalTests * 100).toFixed(2)}%`);
}

// Run tests
runTests().catch(console.error);
