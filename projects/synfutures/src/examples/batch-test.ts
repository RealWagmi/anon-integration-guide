import { askSynFutures } from './askSynFutures';
import chalk from 'chalk';
import { config } from 'dotenv';

interface TestCase {
    category: string;
    description: string;
    prompt: string;
    expectedOutcome: 'success' | 'error';
    expectedContains?: string[];
}

interface TestResult {
    category: string;
    description: string;
    prompt: string;
    status: 'passed' | 'failed';
    actual: 'success' | 'error';
    expected: 'success' | 'error';
    output: string;
    error?: string;
}

const testCases: TestCase[] = [
    // Market Orders
    {
        category: 'Market Orders',
        description: 'Small market buy order',
        prompt: 'Buy 0.01 ETH at market price',
        expectedOutcome: 'success',
        expectedContains: ['market order', 'ETH']
    },
    {
        category: 'Market Orders',
        description: 'Small market sell order',
        prompt: 'Sell 0.005 ETH at market price',
        expectedOutcome: 'success',
        expectedContains: ['market order', 'ETH']
    },

    // Limit Orders
    {
        category: 'Limit Orders',
        description: 'Small limit buy order',
        prompt: 'Place a limit buy order for 0.01 ETH at 2500 USDC',
        expectedOutcome: 'success',
        expectedContains: ['limit order', 'ETH', '2500']
    },
    {
        category: 'Limit Orders',
        description: 'Small limit sell order',
        prompt: 'Place a limit sell order for 0.005 ETH at 3000 USDC',
        expectedOutcome: 'success',
        expectedContains: ['limit order', 'ETH', '3000']
    },

    // Leveraged Positions
    {
        category: 'Leveraged Positions',
        description: 'Small leveraged long position',
        prompt: 'Open a long position with 2x leverage using 0.01 ETH as margin',
        expectedOutcome: 'success',
        expectedContains: ['leverage', 'long position', '2x']
    },
    {
        category: 'Leveraged Positions',
        description: 'Small leveraged short position',
        prompt: 'Open a short position with 2x leverage using 0.005 ETH as margin',
        expectedOutcome: 'success',
        expectedContains: ['leverage', 'short position', '2x']
    },

    // Liquidity Management
    {
        category: 'Liquidity Management',
        description: 'Add small liquidity',
        prompt: 'Provide liquidity to ETH-USDC pool between 2000-3000 with 0.01 ETH',
        expectedOutcome: 'success',
        expectedContains: ['liquidity', 'ETH-USDC', '2000', '3000']
    },
    {
        category: 'Liquidity Management',
        description: 'Remove liquidity with position ID',
        prompt: 'Remove 50% liquidity from position 0x906204d4fddd7658052308d6ea3b71b00854723b5b211ed4034bedd211b5e249',
        expectedOutcome: 'success',
        expectedContains: ['liquidity', '50%', '0x906204']
    },

    // Error Cases
    {
        category: 'Error Handling',
        description: 'Invalid leverage value',
        prompt: 'Open a long position with 100x leverage using 0.01 ETH as margin',
        expectedOutcome: 'error',
        expectedContains: ['Invalid leverage']
    },
    {
        category: 'Error Handling',
        description: 'Zero amount order',
        prompt: 'Buy 0 ETH at market price',
        expectedOutcome: 'error',
        expectedContains: ['Amount must be']
    }
];

async function runTests() {
    // Load environment variables
    config();

    console.log(chalk.blue('\n🚀 Starting SynFutures Integration Batch Tests\n'));
    
    const results: TestResult[] = [];
    let totalTests = 0;
    let passedTests = 0;

    for (const testCase of testCases) {
        totalTests++;
        console.log(chalk.yellow('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.cyan('Category:'), chalk.white(testCase.category));
        console.log(chalk.cyan('Test:'), chalk.white(testCase.description));
        console.log(chalk.cyan('Prompt:'), chalk.white(testCase.prompt));

        try {
            const result = await askSynFutures(testCase.prompt, {
                verbose: true,
                notify: async (message) => console.log(chalk.blue(`\n[Notification] ${message}`))
            });

            // Check if the outcome matches expected
            const success = result.success === (testCase.expectedOutcome === 'success');
            
            // Check if output contains expected strings
            const containsAll = testCase.expectedContains?.every(str => 
                result.data.toLowerCase().includes(str.toLowerCase())
            ) ?? true;

            const passed = success && containsAll;
            if (passed) passedTests++;

            results.push({
                category: testCase.category,
                description: testCase.description,
                prompt: testCase.prompt,
                status: passed ? 'passed' : 'failed',
                actual: result.success ? 'success' : 'error',
                expected: testCase.expectedOutcome,
                output: result.data
            });

            if (passed) {
                console.log(chalk.green('\n✅ Test Passed:'), chalk.white(result.data));
            } else {
                console.log(chalk.red('\n❌ Test Failed:'), chalk.white(result.data));
                if (!containsAll) {
                    console.log(chalk.red('Missing expected content:'), 
                        testCase.expectedContains?.filter(str => 
                            !result.data.toLowerCase().includes(str.toLowerCase())
                        )
                    );
                }
            }
        } catch (error) {
            results.push({
                category: testCase.category,
                description: testCase.description,
                prompt: testCase.prompt,
                status: 'failed',
                actual: 'error',
                expected: testCase.expectedOutcome,
                output: '',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            
            console.log(chalk.red('\n💥 Test Error:'), 
                error instanceof Error ? error.message : 'Unknown error');
        }

        // Add delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Generate Report
    generateReport(results, totalTests, passedTests);
}

function generateReport(results: TestResult[], total: number, passed: number) {
    const reportDate = new Date().toISOString();
    const categories = [...new Set(results.map(r => r.category))];
    
    let report = `# SynFutures Integration Test Report\n\n`;
    report += `Generated: ${reportDate}\n\n`;
    
    // Overall Summary
    report += `## Overall Summary\n\n`;
    report += `- Total Tests: ${total}\n`;
    report += `- Passed: ${passed}\n`;
    report += `- Failed: ${total - passed}\n`;
    report += `- Success Rate: ${((passed/total) * 100).toFixed(2)}%\n\n`;

    // Category Breakdown
    report += `## Results by Category\n\n`;
    for (const category of categories) {
        const categoryResults = results.filter(r => r.category === category);
        const categoryPassed = categoryResults.filter(r => r.status === 'passed').length;
        
        report += `### ${category}\n\n`;
        report += `- Success Rate: ${((categoryPassed/categoryResults.length) * 100).toFixed(2)}%\n`;
        report += `- Passed: ${categoryPassed}/${categoryResults.length}\n\n`;
        
        // Test Details
        report += `| Test | Status | Details |\n`;
        report += `|------|--------|----------|\n`;
        for (const result of categoryResults) {
            const status = result.status === 'passed' ? '✅' : '❌';
            const details = result.error || 
                          (result.status === 'failed' ? 
                            `Expected: ${result.expected}, Got: ${result.actual}` : 
                            'Success');
            report += `| ${result.description} | ${status} | ${details} |\n`;
        }
        report += `\n`;
    }

    // Save report
    const fs = require('fs');
    const reportPath = './test-report.md';
    fs.writeFileSync(reportPath, report);
    
    console.log(chalk.green('\n📊 Test Report Generated'));
    console.log(chalk.white(`Report saved to: ${reportPath}`));
}

// Run the tests
runTests().catch(error => {
    console.error(chalk.red('\n💥 Test Suite Error:'), error);
    process.exit(1);
}); 