import { ChainId } from '@heyanon/sdk/src/blockchain/constants/chains';
import { getMarketInfo } from './functions/queries/getMarketInfo';
import { claimRewards } from './functions/actions/claimRewards';
import { ADDRESSES } from './constants';
import { type Address } from 'viem';
import { provider } from './utils/provider';

async function testMarketInfo(chainName: string, marketAddress: Address) {
    console.log(`\nTesting getMarketInfo on ${chainName}...`);
    try {
        const marketInfoResult = await getMarketInfo({
            chainName,
            marketAddress
        });
        console.log('Market Info Result:', marketInfoResult);
        return marketInfoResult.success;
    } catch (error) {
        console.error('Market Info Error:', error);
        return false;
    }
}

async function testClaimRewards(chainName: string, account: Address, marketAddress: Address) {
    console.log(`\nTesting claimRewards on ${chainName}...`);
    try {
        const claimResult = await claimRewards({
            chainName,
            account,
            marketAddress
        }, {
            sendTransactions: async (params) => {
                console.log('Transaction params:', params);
                return { data: [{ message: 'Transaction would be sent' }], isMultisig: false };
            },
            notify: async (message) => console.log('Notification:', message),
            getProvider: () => provider
        });
        console.log('Claim Result:', claimResult);
        return claimResult.success;
    } catch (error) {
        console.error('Claim Error:', error);
        return false;
    }
}

async function testIntegration() {
    const TEST_ACCOUNT = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as Address;
    let passedTests = 0;
    let totalTests = 0;

    // Helper function to track test results
    const trackTest = (success: boolean, testName: string) => {
        totalTests++;
        if (success) {
            passedTests++;
            console.log(`✅ ${testName} passed`);
        } else {
            console.log(`❌ ${testName} failed`);
        }
    };

    console.log('Starting integration tests...\n');

    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    const VALID_MARKETS = [
        '0x27b1dAcd74688aF24a64BD3C9C1B143118740784',
        '0x2FCb47B58350cD377f94d3821e7373Df60bD9Ced'
    ];

    const mockProvider = {
        readContract: async (params: any) => {
            if (params.address === ZERO_ADDRESS || !VALID_MARKETS.includes(params.address)) {
                throw new Error('Invalid market address');
            }
            
            if (params.functionName === 'isExpired') return false;
            if (params.functionName === 'rewardData') {
                return {
                    pendlePerSec: 1000n,
                    accumulatedPendle: 5000n,
                    lastUpdated: BigInt(Date.now()),
                    incentiveEndsAt: BigInt(Date.now() + 86400000)
                };
            }
            return null;
        }
    };

    const mockSendTransactions = async (params: any) => {
        console.log('Transaction params:', params);
        return { success: true, data: 'Successfully claimed Pendle rewards. Transaction would be sent' };
    };

    const mockNotify = async (message: string) => {
        console.log('Notification:', message);
    };

    const mockGetProvider = () => mockProvider;

    // Test valid market on Ethereum
    console.log('\nTesting valid market on Ethereum:');
    const ethereumMarketInfo = await getMarketInfo({
        chainName: 'ethereum',
        marketAddress: ADDRESSES[ChainId.ETHEREUM].MARKET_FACTORY as Address
    });
    console.log('Market Info Result:', ethereumMarketInfo);
    trackTest(ethereumMarketInfo.success, 'Ethereum getMarketInfo');

    const ethereumClaimResult = await claimRewards({
        chainName: 'ethereum',
        account: TEST_ACCOUNT,
        marketAddress: ADDRESSES[ChainId.ETHEREUM].MARKET_FACTORY as Address
    }, {
        sendTransactions: mockSendTransactions,
        notify: mockNotify,
        getProvider: mockGetProvider
    });
    console.log('Claim Result:', ethereumClaimResult);
    trackTest(ethereumClaimResult.success, 'Ethereum claimRewards');

    // Test valid market on Arbitrum
    console.log('\nTesting valid market on Arbitrum:');
    const arbitrumMarketInfo = await getMarketInfo({
        chainName: 'arbitrum-one',
        marketAddress: ADDRESSES[ChainId.ARBITRUM].MARKET_FACTORY as Address
    });
    console.log('Market Info Result:', arbitrumMarketInfo);
    trackTest(arbitrumMarketInfo.success, 'Arbitrum getMarketInfo');

    const arbitrumClaimResult = await claimRewards({
        chainName: 'arbitrum-one',
        account: TEST_ACCOUNT,
        marketAddress: ADDRESSES[ChainId.ARBITRUM].MARKET_FACTORY as Address
    }, {
        sendTransactions: mockSendTransactions,
        notify: mockNotify,
        getProvider: mockGetProvider
    });
    console.log('Claim Result:', arbitrumClaimResult);
    trackTest(arbitrumClaimResult.success, 'Arbitrum claimRewards');

    // Test invalid market address
    console.log('\nTesting invalid market address:');
    const invalidMarketInfo = await getMarketInfo({
        chainName: 'ethereum',
        marketAddress: ZERO_ADDRESS as Address
    });
    console.log('Invalid Market Info Result:', invalidMarketInfo);
    trackTest(!invalidMarketInfo.success, 'Invalid market getMarketInfo');

    const invalidClaimResult = await claimRewards({
        chainName: 'ethereum',
        account: TEST_ACCOUNT,
        marketAddress: ZERO_ADDRESS as Address
    }, {
        sendTransactions: mockSendTransactions,
        notify: mockNotify,
        getProvider: mockGetProvider
    });
    console.log('Invalid Claim Result:', invalidClaimResult);
    trackTest(!invalidClaimResult.success, 'Invalid market claimRewards');

    // Test invalid chain
    console.log('\nTesting invalid chain:');
    const invalidChainMarketInfo = await getMarketInfo({
        chainName: 'invalid_chain',
        marketAddress: ADDRESSES[ChainId.ETHEREUM].MARKET_FACTORY as Address
    });
    console.log('Invalid Chain Market Info Result:', invalidChainMarketInfo);
    trackTest(!invalidChainMarketInfo.success, 'Invalid chain getMarketInfo');

    const invalidChainClaimResult = await claimRewards({
        chainName: 'invalid_chain',
        account: TEST_ACCOUNT,
        marketAddress: ADDRESSES[ChainId.ETHEREUM].MARKET_FACTORY as Address
    }, {
        sendTransactions: mockSendTransactions,
        notify: mockNotify,
        getProvider: mockGetProvider
    });
    console.log('Invalid Chain Claim Result:', invalidChainClaimResult);
    trackTest(!invalidChainClaimResult.success, 'Invalid chain claimRewards');

    console.log('\n----------------------------------------');
    console.log(`Test Summary: ${passedTests}/${totalTests} tests passed`);
    const allTestsPassed = passedTests === totalTests;
    console.log(allTestsPassed ? '✅ All tests passed' : '❌ Some tests failed');
    process.exit(allTestsPassed ? 0 : 1);
}

testIntegration().catch(console.error); 