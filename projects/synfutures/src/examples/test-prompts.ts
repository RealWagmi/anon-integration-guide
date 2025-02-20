import chalk from 'chalk';
import { askSynFutures } from './askSynFutures';

interface TestCase {
    category: string;
    description: string;
    prompt: string;
    expectedResult: 'success' | 'error';
    expectedMessage?: string;
}

const testCases: TestCase[] = [
    // Market Orders - Valid Cases
    {
        category: 'Market Orders',
        description: 'Basic market buy',
        prompt: "Buy 1 ETH at market price",
        expectedResult: 'success'
    },
    {
        category: 'Market Orders',
        description: 'Basic market sell',
        prompt: "Sell 0.5 ETH at market price",
        expectedResult: 'success'
    },
    {
        category: 'Market Orders',
        description: 'Market buy with decimal',
        prompt: "Buy 1.5 ETH at market price",
        expectedResult: 'success'
    },

    // Market Orders - Invalid Cases
    {
        category: 'Market Orders',
        description: 'Zero amount market buy',
        prompt: "Buy 0 ETH at market price",
        expectedResult: 'error',
        expectedMessage: 'Amount must be greater than 0'
    },
    {
        category: 'Market Orders',
        description: 'Negative amount market sell',
        prompt: "Sell -1 ETH at market price",
        expectedResult: 'error',
        expectedMessage: 'Amount must be greater than 0'
    },
    {
        category: 'Market Orders',
        description: 'Invalid token pair',
        prompt: "Buy 1 INVALID at market price",
        expectedResult: 'error',
        expectedMessage: 'Unsupported trading pair'
    },

    // Limit Orders - Valid Cases
    {
        category: 'Limit Orders',
        description: 'Basic limit buy',
        prompt: "Place a limit buy order for 1 ETH at 1800 USDC",
        expectedResult: 'success'
    },
    {
        category: 'Limit Orders',
        description: 'Basic limit sell',
        prompt: "Place a limit sell order for 0.5 ETH at 2000 USDC",
        expectedResult: 'success'
    },

    // Limit Orders - Invalid Cases
    {
        category: 'Limit Orders',
        description: 'Zero price limit order',
        prompt: "Place a limit buy order for 1 ETH at 0 USDC",
        expectedResult: 'error',
        expectedMessage: 'Price must be greater than 0'
    },
    {
        category: 'Limit Orders',
        description: 'Missing price in limit order',
        prompt: "Place a limit sell order for 0.5 ETH",
        expectedResult: 'error',
        expectedMessage: 'Price is required for limit orders'
    },

    // Leveraged Positions - Valid Cases
    {
        category: 'Leveraged Positions',
        description: 'Long position with 2x leverage',
        prompt: "Open a long position with 2x leverage using 0.1 ETH as margin",
        expectedResult: 'success'
    },
    {
        category: 'Leveraged Positions',
        description: 'Short position with max leverage',
        prompt: "Open a short position with 25x leverage using 0.2 ETH as margin",
        expectedResult: 'success'
    },

    // Leveraged Positions - Invalid Cases
    {
        category: 'Leveraged Positions',
        description: 'Invalid leverage value',
        prompt: "Open a long position with 100x leverage using 0.1 ETH as margin",
        expectedResult: 'error',
        expectedMessage: 'Invalid leverage. Supported values: 2x, 5x, 10x, 15x, 25x'
    },
    {
        category: 'Leveraged Positions',
        description: 'Missing margin amount',
        prompt: "Open a short position with 5x leverage",
        expectedResult: 'error',
        expectedMessage: 'Margin amount is required'
    },

    // Liquidity Management - Valid Cases
    {
        category: 'Liquidity Management',
        description: 'Basic liquidity provision',
        prompt: "Provide liquidity to ETH-USDC pool between 1800-2200 with 1 ETH",
        expectedResult: 'success'
    },
    {
        category: 'Liquidity Management',
        description: 'Remove partial liquidity',
        prompt: "Remove 50% liquidity from position #123",
        expectedResult: 'success'
    },
    {
        category: 'Liquidity Management',
        description: 'Remove all liquidity',
        prompt: "Remove 100% liquidity from position #456",
        expectedResult: 'success'
    },

    // Liquidity Management - Invalid Cases
    {
        category: 'Liquidity Management',
        description: 'Invalid percentage removal',
        prompt: "Remove 150% liquidity from position #789",
        expectedResult: 'error',
        expectedMessage: 'Percentage must be between 0 and 100'
    },
    {
        category: 'Liquidity Management',
        description: 'Missing position ID',
        prompt: "Remove 50% liquidity",
        expectedResult: 'error',
        expectedMessage: 'Position ID is required'
    },
    {
        category: 'Liquidity Management',
        description: 'Invalid price range',
        prompt: "Provide liquidity to ETH-USDC pool between 2200-1800 with 1 ETH",
        expectedResult: 'error',
        expectedMessage: 'Upper price must be greater than lower price'
    },

    // Special Cases
    {
        category: 'Special Cases',
        description: 'Special characters in input',
        prompt: "Buy 1 ETH at market price!!!",
        expectedResult: 'success'
    },
    {
        category: 'Special Cases',
        description: 'Multiple spaces between words',
        prompt: "Sell    0.5    ETH    at    market    price",
        expectedResult: 'success'
    },
    {
        category: 'Special Cases',
        description: 'Empty command',
        prompt: "",
        expectedResult: 'error',
        expectedMessage: 'Command cannot be empty'
    }
];

interface TestResult {
    category: string;
    description: string;
    prompt: string;
    expected: 'success' | 'error';
    actual: 'success' | 'error';
    passed: boolean;
    message: string;
}

async function runTests() {
    console.log(chalk.blue('\n🚀 Starting SynFutures Integration Tests\n'));
    
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
            
            const passed = result.success === (testCase.expectedResult === 'success');
            if (passed) passedTests++;
            
            results.push({
                category: testCase.category,
                description: testCase.description,
                prompt: testCase.prompt,
                expected: testCase.expectedResult,
                actual: result.success ? 'success' : 'error',
                passed,
                message: result.data
            });

            if (result.success) {
                console.log(chalk.green('\n✅ Success:'), chalk.white(result.data));
            } else {
                console.log(chalk.red('\n❌ Error:'), chalk.white(result.data));
            }
        } catch (error) {
            results.push({
                category: testCase.category,
                description: testCase.description,
                prompt: testCase.prompt,
                expected: testCase.expectedResult,
                actual: 'error',
                passed: testCase.expectedResult === 'error',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
            
            console.error(chalk.red('\n💥 Unexpected Error:'), 
                error instanceof Error ? error.message : 'Unknown error');
        }
        
        // Add a small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Print Summary Report
    console.log(chalk.blue('\n\n📊 Test Summary Report'));
    console.log(chalk.yellow('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    
    // Summary by Category
    const categories = [...new Set(results.map(r => r.category))];
    for (const category of categories) {
        const categoryResults = results.filter(r => r.category === category);
        const categoryPassed = categoryResults.filter(r => r.passed).length;
        const categoryTotal = categoryResults.length;
        
        console.log(chalk.cyan(`\n${category}:`));
        console.log(chalk.white(`Passed: ${categoryPassed}/${categoryTotal} (${Math.round(categoryPassed/categoryTotal*100)}%)`));
        
        // List failed tests in category
        const failedTests = categoryResults.filter(r => !r.passed);
        if (failedTests.length > 0) {
            console.log(chalk.red('\nFailed Tests:'));
            failedTests.forEach(test => {
                console.log(chalk.red(`- ${test.description}`));
                console.log(chalk.gray(`  Prompt: ${test.prompt}`));
                console.log(chalk.gray(`  Expected: ${test.expected}, Got: ${test.actual}`));
                console.log(chalk.gray(`  Message: ${test.message}`));
            });
        }
    }
    
    // Overall Summary
    console.log(chalk.yellow('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.blue('\n📈 Overall Results:'));
    console.log(chalk.white(`Total Tests: ${totalTests}`));
    console.log(chalk.green(`Passed: ${passedTests}`));
    console.log(chalk.red(`Failed: ${totalTests - passedTests}`));
    console.log(chalk.white(`Success Rate: ${Math.round(passedTests/totalTests*100)}%`));
    
    console.log(chalk.blue('\n\n🎉 Test Suite Completed!\n'));
}

// Run the tests
runTests().catch(error => {
    console.error(chalk.red('\n💥 Test Suite Error:'), error);
    process.exit(1);
}); 