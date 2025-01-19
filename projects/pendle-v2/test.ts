import { type Address } from 'viem';
import { provider } from './utils/provider';
import { getMarketInfo } from './functions/queries/getMarketInfo';
import { claimRewards } from './functions/actions/claimRewards';
import { redeemRewards } from './functions/actions/redeemRewards';
import { redeemExternalReward } from './functions/actions/redeemExternalReward';
import { initialize } from './functions/actions/routerFunctions';
import { addLiquidity } from './functions/actions/routerFunctions';
import { removeLiquidity } from './functions/actions/routerFunctions';
import { ADDRESSES } from './constants';
import { swapExactTokensForTokens } from './functions/actions/routerFunctions';
import { swapTokensForExactTokens } from './functions/actions/routerFunctions';
import { addLiquidityETH } from './functions/actions/routerFunctions';
import { removeLiquidityETH } from './functions/actions/routerFunctions';
import { staleCheckLatestRoundData, getTimeout, getPriceFromChainlink } from './functions/oracleLib';
import { calcMessageFee, sendMessage, executeMessage } from './functions/actions/pendleMsgReceive';
import { mintSyFromToken, redeemSyToToken, mintPyFromToken } from './functions/actions/actionMisc';
import { addLiquiditySinglePtSimple, addLiquiditySingleTokenSimple, addLiquiditySingleSySimple, removeLiquiditySinglePtSimple, swapExactTokenForPtSimple } from './functions/actions/actionSimple';
import {
    addLiquidityDualSyAndPtStatic,
    addLiquidityDualTokenAndPtStatic,
    addLiquiditySinglePtStatic,
    addLiquiditySingleSyKeepYtStatic
} from './functions/actions/actionMarketCore';
import {
    calcPriceImpactPY,
    calcPriceImpactPt,
    calcPriceImpactYt,
    getMarketState,
    getYieldTokenAndPtRate,
    getYieldTokenAndYtRate,
    getLpToSyRate
} from './functions/actions/actionMarketAux';
import {
    getAmountTokenToMintSy,
    mintPyFromSyStatic,
    mintPyFromTokenStatic,
    mintSyFromTokenStatic,
    redeemPyToSyStatic,
    redeemPyToTokenStatic,
    redeemSyToTokenStatic,
    pyIndexCurrentViewMarket
} from './functions/actions/actionMintRedeem';
import { lock, getLockedBalance } from './functions/actions/votingEscrow';
import { claimReward, getUserInfo } from './functions/actions/feeDistributor';
import { isValidMarket } from './functions/queries/marketFactory';
import { observe, getOracleState, getObservation } from './functions/queries/marketOracle';
import { claimRetail, claimProtocol, getProtocolClaimables, getProtocolTotalAccrued } from './functions/actions/feeDistributorV2';
import { fillOrders, cancelBatchOrders, cancelOrder, getOrderStatuses, getDomainSeparator, simulate } from './functions/actions/limitOrder';
import { addLiquidityDualTokenAndPt, addLiquidityDualSyAndPt, addLiquiditySinglePt, addLiquiditySingleToken, addLiquiditySingleSy, removeLiquidityDualSyAndPt, removeLiquiditySingleToken, removeLiquiditySingleSy } from './functions/actions/actionAddRemoveLiq';

// Add type definitions at the top of the file
interface AggregatorV3Interface {
    decimals(): Promise<number>;
    description(): Promise<string>;
    version(): Promise<number>;
    getRoundData(roundId: number): Promise<{
        roundId: number;
        answer: number;
        startedAt: number;
        updatedAt: number;
        answeredInRound: number;
    }>;
    latestRoundData(): Promise<{
        roundId: number;
        answer: number;
        startedAt: number;
        updatedAt: number;
        answeredInRound: number;
    }>;
    timeout(): Promise<number>;
}

enum ChainId {
    ETHEREUM = 1,
    BSC = 56,
    ARBITRUM = 42161,
    OPTIMISM = 10,
    POLYGON = 137,
    AVALANCHE = 43114,
    FANTOM = 250,
    ZKSYNC = 324,
    SEPOLIA = 11155111
}

// Market Core Actions Tests
async function testMarketCoreActions() {
    console.log('\nTesting Market Core Actions...');
    
    const market = '0x27b1dAcd74688aF24a64BD3C9C1B143118740784' as Address;
    const tokenIn = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as Address;
    
    try {
        let allTestsPassed = true;

        // Test addLiquidityDualSyAndPtStatic
        const dualSyResult = await addLiquidityDualSyAndPtStatic(
            market,
            '1000000000000000000',
            '1000000000000000000',
            { getProvider: () => provider }
        );
        console.log('Add Liquidity Dual Sy And Pt Static Result:', dualSyResult);
        allTestsPassed = allTestsPassed && dualSyResult.success;

        // Test addLiquidityDualTokenAndPtStatic
        const dualTokenResult = await addLiquidityDualTokenAndPtStatic(
            market,
            tokenIn,
            '1000000000000000000',
            '1000000000000000000',
            { getProvider: () => provider }
        );
        console.log('Add Liquidity Dual Token And Pt Static Result:', dualTokenResult);
        allTestsPassed = allTestsPassed && dualTokenResult.success;

        // Test addLiquiditySinglePtStatic
        const singlePtResult = await addLiquiditySinglePtStatic(
            market,
            '1000000000000000000',
            { getProvider: () => provider }
        );
        console.log('Add Liquidity Single Pt Static Result:', singlePtResult);
        allTestsPassed = allTestsPassed && singlePtResult.success;

        // Test addLiquiditySingleSyKeepYtStatic
        const singleSyResult = await addLiquiditySingleSyKeepYtStatic(
            market,
            '1000000000000000000',
            { getProvider: () => provider }
        );
        console.log('Add Liquidity Single Sy Keep Yt Static Result:', singleSyResult);
        allTestsPassed = allTestsPassed && singleSyResult.success;

        return allTestsPassed;
    } catch (error) {
        console.error('Market Core Actions Error:', error);
        return false;
    }
}

// Market Auxiliary Actions Tests
async function testMarketAuxActions(market: string): Promise<boolean> {
    console.log('Testing market auxiliary actions...');
    try {
        // Test price impact calculations
        const netPtOut = '-1000000000000000000'; // -1 ETH to test price impact
        const priceImpactPYResult = await calcPriceImpactPY(market as Address, netPtOut, { getProvider: () => provider });
        console.log('Price impact PY:', priceImpactPYResult);

        const priceImpactPtResult = await calcPriceImpactPt(market as Address, netPtOut, { getProvider: () => provider });
        console.log('Price impact PT:', priceImpactPtResult);

        const priceImpactYtResult = await calcPriceImpactYt(market as Address, netPtOut, { getProvider: () => provider });
        console.log('Price impact YT:', priceImpactYtResult);

        // Test market state retrieval
        const marketStateResult = await getMarketState(market as Address, { getProvider: () => provider });
        console.log('Market state:', marketStateResult);

        // Test token rates
        const tokenPtRateResult = await getYieldTokenAndPtRate(market as Address, { getProvider: () => provider });
        console.log('Token PT rate:', tokenPtRateResult);

        const tokenYtRateResult = await getYieldTokenAndYtRate(market as Address, { getProvider: () => provider });
        console.log('Token YT rate:', tokenYtRateResult);

        const lpToSyRateResult = await getLpToSyRate(market as Address, { getProvider: () => provider });
        console.log('LP to SY rate:', lpToSyRateResult);

        return true;
    } catch (error) {
        console.error('Error in market auxiliary actions:', error);
        return false;
    }
}

// Mint/Redeem Actions Tests
async function testMintRedeemActions(market: string, tokenAddress: string): Promise<boolean> {
    console.log('Testing mint/redeem actions...');
    try {
        const SY = '0x1234567890123456789012345678901234567890';
        const YT = '0x0987654321098765432109876543210987654321';
        const netSyOut = '1000000000000000000'; // 1 ETH
        const netTokenIn = '1000000000000000000'; // 1 ETH

        // Test getAmountTokenToMintSy
        const amountTokenResult = await getAmountTokenToMintSy(
            SY as Address,
            tokenAddress as Address,
            netSyOut,
            { getProvider: () => provider }
        );
        console.log('Amount token to mint SY:', amountTokenResult);

        // Test mintPyFromSyStatic
        const mintPyFromSyResult = await mintPyFromSyStatic(
            YT as Address,
            netSyOut,
            { getProvider: () => provider }
        );
        console.log('Mint PY from SY:', mintPyFromSyResult);

        // Test mintPyFromTokenStatic
        const mintPyFromTokenResult = await mintPyFromTokenStatic(
            YT as Address,
            tokenAddress as Address,
            netTokenIn,
            { getProvider: () => provider }
        );
        console.log('Mint PY from token:', mintPyFromTokenResult);

        // Test mintSyFromTokenStatic
        const mintSyFromTokenResult = await mintSyFromTokenStatic(
            SY as Address,
            tokenAddress as Address,
            netTokenIn,
            { getProvider: () => provider }
        );
        console.log('Mint SY from token:', mintSyFromTokenResult);

        // Test redeemPyToSyStatic
        const redeemPyToSyResult = await redeemPyToSyStatic(
            YT as Address,
            netTokenIn,
            { getProvider: () => provider }
        );
        console.log('Redeem PY to SY:', redeemPyToSyResult);

        // Test redeemPyToTokenStatic
        const redeemPyToTokenResult = await redeemPyToTokenStatic(
            YT as Address,
            netTokenIn,
            tokenAddress as Address,
            { getProvider: () => provider }
        );
        console.log('Redeem PY to token:', redeemPyToTokenResult);

        // Test redeemSyToTokenStatic
        const redeemSyToTokenResult = await redeemSyToTokenStatic(
            SY as Address,
            tokenAddress as Address,
            netTokenIn,
            { getProvider: () => provider }
        );
        console.log('Redeem SY to token:', redeemSyToTokenResult);

        // Test pyIndexCurrentViewMarket
        const pyIndexResult = await pyIndexCurrentViewMarket(market as Address, { getProvider: () => provider });
        console.log('PY index current view:', pyIndexResult);

        return true;
    } catch (error) {
        console.error('Error in mint/redeem actions:', error);
        return false;
    }
}

// Market Info Tests
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

// Reward Tests
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

async function testRedeemRewards(user: Address, gaugeAddress: Address) {
    console.log(`\nTesting redeemRewards for user: ${user} and gauge: ${gaugeAddress}...`);
    try {
        const result = await redeemRewards(user, gaugeAddress, {
            sendTransactions: async (params: any) => {
                console.log('Transaction params:', params);
                return { success: true, data: 'Successfully redeemed rewards' };
            },
            notify: async (message: string) => console.log('Notification:', message),
            getProvider: () => provider
        });
        console.log('Redeem Rewards Result:', result);
        return result.success;
    } catch (error) {
        console.error('Redeem Rewards Error:', error);
        return false;
    }
}

async function testRedeemExternalReward(gaugeAddress: Address) {
    console.log(`\nTesting redeemExternalReward for gauge: ${gaugeAddress}...`);
    try {
        const result = await redeemExternalReward(gaugeAddress, {
            sendTransactions: async (params: any) => {
                console.log('Transaction params:', params);
                return { success: true, data: 'Successfully redeemed external rewards' };
            },
            notify: async (message: string) => console.log('Notification:', message),
            getProvider: () => provider
        });
        console.log('Redeem External Reward Result:', result);
        return result.success;
    } catch (error) {
        console.error('Redeem External Reward Error:', error);
        return false;
    }
}

// Router Function Tests
async function testInitialize(factory: Address, WETH: Address) {
    console.log(`\nTesting initialize with factory: ${factory} and WETH: ${WETH}...`);
    try {
        const result = await initialize(factory, WETH, {
            sendTransactions: async (params: any) => {
                console.log('Transaction params:', params);
                return { success: true, data: 'Router initialized successfully' };
            },
            notify: async (message: string) => console.log('Notification:', message),
            getProvider: () => provider
        });
        console.log('Initialize Result:', result);
        return result.success;
    } catch (error) {
        console.error('Initialize Error:', error);
        return false;
    }
}

async function testAddLiquidity(tokenA: Address, tokenB: Address, amountADesired: string, amountBDesired: string, amountAMin: string, amountBMin: string, to: Address, deadline: number) {
    console.log(`\nTesting addLiquidity with tokenA: ${tokenA}, tokenB: ${tokenB}...`);
    try {
        const result = await addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin, to, deadline, {
            sendTransactions: async (params: any) => {
                console.log('Transaction params:', params);
                return { success: true, data: 'Liquidity added successfully' };
            },
            notify: async (message: string) => console.log('Notification:', message),
            getProvider: () => provider
        });
        console.log('Add Liquidity Result:', result);
        return result.success;
    } catch (error) {
        console.error('Add Liquidity Error:', error);
        return false;
    }
}

// Market Oracle Tests
async function testMarketOracle(market: string): Promise<boolean> {
    console.log('Testing market oracle functions...');
    try {
        // Test observe function
        const secondsAgos = [60, 120, 180]; // Test for last 1, 2, and 3 minutes
        const observeResult = await observe(market as Address, secondsAgos, { getProvider: () => provider });
        console.log('Observe result:', observeResult);

        // Test getOracleState function
        const oracleStateResult = await getOracleState(market as Address, { getProvider: () => provider });
        console.log('Oracle state:', oracleStateResult);

        // Test getObservation function
        const observationResult = await getObservation(market as Address, 0, { getProvider: () => provider });
        console.log('Observation at index 0:', observationResult);

        return true;
    } catch (error) {
        console.error('Error in market oracle tests:', error);
        return false;
    }
}

// Fee Distributor V2 Tests
async function testFeeDistributorV2Actions(user: Address): Promise<boolean> {
    console.log('Testing fee distributor V2 actions...');
    try {
        const mockPools = [
            '0x27b1dAcd74688aF24a64BD3C9C1B143118740784',
            '0x2FCb47B58350cD377f94d3821e7373Df60bD9Ced'
        ] as Address[];

        // Test claimRetail
        const mockProof = ['0x1234567890123456789012345678901234567890123456789012345678901234'];
        const claimRetailResult = await claimRetail(
            user,
            '1000000000000000000',
            mockProof,
            {
                sendTransactions: async (params: any) => {
                    console.log('Transaction params:', params);
                    return { success: true, data: 'Successfully claimed retail rewards' };
                },
                notify: async (message: string) => console.log('Notification:', message),
                getProvider: () => provider
            }
        );
        console.log('Claim retail result:', claimRetailResult);

        // Test claimProtocol
        const claimProtocolResult = await claimProtocol(
            user,
            mockPools,
            {
                sendTransactions: async (params: any) => {
                    console.log('Transaction params:', params);
                    return { success: true, data: { totalAmountOut: '1000000000000000000', amountsOut: ['500000000000000000', '500000000000000000'] } };
                },
                notify: async (message: string) => console.log('Notification:', message),
                getProvider: () => provider
            }
        );
        console.log('Claim protocol result:', claimProtocolResult);

        // Test getProtocolClaimables
        const claimablesResult = await getProtocolClaimables(
            user,
            mockPools,
            { getProvider: () => provider }
        );
        console.log('Protocol claimables:', claimablesResult);

        // Test getProtocolTotalAccrued
        const totalAccruedResult = await getProtocolTotalAccrued(
            user,
            { getProvider: () => provider }
        );
        console.log('Protocol total accrued:', totalAccruedResult);

        return true;
    } catch (error) {
        console.error('Error in fee distributor V2 tests:', error);
        return false;
    }
}

// Limit Order Tests
async function testLimitOrders(user: Address): Promise<boolean> {
    console.log('Testing limit order functions...');
    try {
        const mockOrder = {
            salt: '1000000000000000000',
            expiry: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            nonce: 0,
            orderType: 0,
            token: '0x27b1dAcd74688aF24a64BD3C9C1B143118740784' as Address,
            YT: '0x2FCb47B58350cD377f94d3821e7373Df60bD9Ced' as Address,
            maker: user,
            receiver: user,
            makingAmount: '1000000000000000000',
            lnImpliedRate: '1000000000000000000',
            failSafeRate: '1000000000000000000',
            permit: '0x'
        };

        // Test fillOrders
        const fillParams = [{
            order: mockOrder,
            makingAmount: '1000000000000000000',
            signature: '0x1234567890123456789012345678901234567890123456789012345678901234'
        }];

        const fillResult = await fillOrders(
            fillParams,
            user,
            '1000000000000000000',
            '0x',
            {
                sendTransactions: async (params: any) => {
                    console.log('Transaction params:', params);
                    return { success: true, data: {
                        actualMaking: '1000000000000000000',
                        actualTaking: '1000000000000000000',
                        totalFee: '10000000000000000',
                        callbackReturn: '0x'
                    }};
                },
                notify: async (message: string) => console.log('Notification:', message),
                getProvider: () => provider
            }
        );
        console.log('Fill orders result:', fillResult);

        // Test cancelBatchOrders
        const cancelBatchResult = await cancelBatchOrders(
            [mockOrder],
            {
                sendTransactions: async (params: any) => {
                    console.log('Transaction params:', params);
                    return { success: true, data: 'Successfully cancelled batch orders' };
                },
                notify: async (message: string) => console.log('Notification:', message),
                getProvider: () => provider
            }
        );
        console.log('Cancel batch orders result:', cancelBatchResult);

        // Test cancelOrder
        const cancelResult = await cancelOrder(
            mockOrder,
            {
                sendTransactions: async (params: any) => {
                    console.log('Transaction params:', params);
                    return { success: true, data: 'Successfully cancelled order' };
                },
                notify: async (message: string) => console.log('Notification:', message),
                getProvider: () => provider
            }
        );
        console.log('Cancel order result:', cancelResult);

        // Test getOrderStatuses
        const orderHashes = ['0x1234567890123456789012345678901234567890123456789012345678901234'];
        const statusesResult = await getOrderStatuses(
            orderHashes,
            { getProvider: () => provider }
        );
        console.log('Order statuses:', statusesResult);

        // Test getDomainSeparator
        const domainResult = await getDomainSeparator(
            { getProvider: () => provider }
        );
        console.log('Domain separator:', domainResult);

        // Test simulate
        const simulateResult = await simulate(
            user,
            '0x1234567890',
            {
                sendTransactions: async (params: any) => {
                    console.log('Transaction params:', params);
                    return { success: true, data: { success: true, result: '0x' }};
                },
                getProvider: () => provider
            }
        );
        console.log('Simulate result:', simulateResult);

        return true;
    } catch (error) {
        console.error('Error in limit order tests:', error);
        return false;
    }
}

// Add/Remove Liquidity Tests
async function testAddRemoveLiquidity(user: Address): Promise<boolean> {
    console.log('Testing add/remove liquidity functions...');
    try {
        const market = '0x27b1dAcd74688aF24a64BD3C9C1B143118740784' as Address;
        const tokenInput = {
            tokenIn: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as Address,
            netTokenIn: '1000000000000000000',
            tokenMintSy: '0x2FCb47B58350cD377f94d3821e7373Df60bD9Ced' as Address,
            bulk: false
        };
        const tokenOutput = {
            tokenOut: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as Address,
            minTokenOut: '900000000000000000',
            bulk: false
        };
        const approxParams = {
            guessMin: '1000000000000000000',
            guessMax: '2000000000000000000',
            guessOffchain: '1500000000000000000',
            maxIteration: 10,
            eps: '1000000000000000'
        };
        const limitData = {
            deadline: Math.floor(Date.now() / 1000) + 3600,
            limitPrice: '1000000000000000000'
        };

        // Test addLiquidityDualTokenAndPt
        const dualTokenResult = await addLiquidityDualTokenAndPt(
            user,
            market,
            tokenInput,
            '1000000000000000000',
            '900000000000000000',
            {
                sendTransactions: async (params: any) => {
                    console.log('Transaction params:', params);
                    return { success: true, data: {
                        netLpOut: '1000000000000000000',
                        netPtUsed: '1000000000000000000',
                        netSyInterm: '1000000000000000000'
                    }};
                },
                notify: async (message: string) => console.log('Notification:', message),
                getProvider: () => provider
            }
        );
        console.log('Add liquidity dual token and PT result:', dualTokenResult);

        // Test addLiquidityDualSyAndPt
        const dualSyResult = await addLiquidityDualSyAndPt(
            user,
            market,
            '1000000000000000000',
            '1000000000000000000',
            '900000000000000000',
            {
                sendTransactions: async (params: any) => {
                    console.log('Transaction params:', params);
                    return { success: true, data: {
                        netLpOut: '1000000000000000000',
                        netSyUsed: '1000000000000000000',
                        netPtUsed: '1000000000000000000'
                    }};
                },
                notify: async (message: string) => console.log('Notification:', message),
                getProvider: () => provider
            }
        );
        console.log('Add liquidity dual SY and PT result:', dualSyResult);

        // Test addLiquiditySinglePt
        const singlePtResult = await addLiquiditySinglePt(
            user,
            market,
            '1000000000000000000',
            '900000000000000000',
            approxParams,
            limitData,
            {
                sendTransactions: async (params: any) => {
                    console.log('Transaction params:', params);
                    return { success: true, data: {
                        netLpOut: '1000000000000000000',
                        netSyFee: '10000000000000000'
                    }};
                },
                notify: async (message: string) => console.log('Notification:', message),
                getProvider: () => provider
            }
        );
        console.log('Add liquidity single PT result:', singlePtResult);

        // Test addLiquiditySingleToken
        const singleTokenResult = await addLiquiditySingleToken(
            user,
            market,
            '900000000000000000',
            approxParams,
            tokenInput,
            limitData,
            {
                sendTransactions: async (params: any) => {
                    console.log('Transaction params:', params);
                    return { success: true, data: {
                        netLpOut: '1000000000000000000',
                        netSyFee: '10000000000000000',
                        netSyInterm: '1000000000000000000'
                    }};
                },
                notify: async (message: string) => console.log('Notification:', message),
                getProvider: () => provider
            }
        );
        console.log('Add liquidity single token result:', singleTokenResult);

        // Test addLiquiditySingleSy
        const singleSyResult = await addLiquiditySingleSy(
            user,
            market,
            '1000000000000000000',
            '900000000000000000',
            approxParams,
            limitData,
            {
                sendTransactions: async (params: any) => {
                    console.log('Transaction params:', params);
                    return { success: true, data: {
                        netLpOut: '1000000000000000000',
                        netSyFee: '10000000000000000'
                    }};
                },
                notify: async (message: string) => console.log('Notification:', message),
                getProvider: () => provider
            }
        );
        console.log('Add liquidity single SY result:', singleSyResult);

        // Test removeLiquidityDualSyAndPt
        const removeDualResult = await removeLiquidityDualSyAndPt(
            user,
            market,
            '1000000000000000000',
            '900000000000000000',
            '900000000000000000',
            {
                sendTransactions: async (params: any) => {
                    console.log('Transaction params:', params);
                    return { success: true, data: {
                        netSyOut: '1000000000000000000',
                        netPtOut: '1000000000000000000'
                    }};
                },
                notify: async (message: string) => console.log('Notification:', message),
                getProvider: () => provider
            }
        );
        console.log('Remove liquidity dual SY and PT result:', removeDualResult);

        // Test removeLiquiditySingleToken
        const removeSingleTokenResult = await removeLiquiditySingleToken(
            user,
            market,
            '1000000000000000000',
            tokenOutput,
            approxParams,
            limitData,
            {
                sendTransactions: async (params: any) => {
                    console.log('Transaction params:', params);
                    return { success: true, data: {
                        netTokenOut: '1000000000000000000',
                        netSyFee: '10000000000000000',
                        netSyInterm: '1000000000000000000'
                    }};
                },
                notify: async (message: string) => console.log('Notification:', message),
                getProvider: () => provider
            }
        );
        console.log('Remove liquidity single token result:', removeSingleTokenResult);

        // Test removeLiquiditySingleSy
        const removeSingleSyResult = await removeLiquiditySingleSy(
            user,
            market,
            '1000000000000000000',
            '900000000000000000',
            approxParams,
            limitData,
            {
                sendTransactions: async (params: any) => {
                    console.log('Transaction params:', params);
                    return { success: true, data: {
                        netSyOut: '1000000000000000000',
                        netSyFee: '10000000000000000'
                    }};
                },
                notify: async (message: string) => console.log('Notification:', message),
                getProvider: () => provider
            }
        );
        console.log('Remove liquidity single SY result:', removeSingleSyResult);

        return true;
    } catch (error) {
        console.error('Error in add/remove liquidity tests:', error);
        return false;
    }
}

// Main Integration Test
async function testIntegration() {
    console.log('Starting integration tests...\n');

    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    const VALID_MARKETS = [
        '0x27b1dAcd74688aF24a64BD3C9C1B143118740784',
        '0x2FCb47B58350cD377f94d3821e7373Df60bD9Ced'
    ];

    const mockSendTransactions = async (params: any) => {
        console.log('Transaction params:', params);
        return { success: true, data: 'Successfully executed transaction' };
    };

    const mockNotify = async (message: string) => {
        console.log('Notification:', message);
    };

    try {
        // Test Market Core Actions
        console.log('\nTesting Market Core Actions...');
        const marketCoreResult = await testMarketCoreActions();
        console.log('Market Core Actions Tests:', marketCoreResult ? 'PASSED' : 'FAILED');

        // Test Market Auxiliary Actions
        console.log('\nTesting Market Auxiliary Actions...');
        const marketAuxResult = await testMarketAuxActions(VALID_MARKETS[0]);
        console.log('Market Auxiliary Actions Tests:', marketAuxResult ? 'PASSED' : 'FAILED');

        // Test Mint/Redeem Actions
        console.log('\nTesting Mint/Redeem Actions...');
        const mintRedeemResult = await testMintRedeemActions(
            VALID_MARKETS[0],
            '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
        );
        console.log('Mint/Redeem Actions Tests:', mintRedeemResult ? 'PASSED' : 'FAILED');

        // Test Market Info
        console.log('\nTesting Market Info...');
        const marketInfoResult = await testMarketInfo('ethereum', VALID_MARKETS[0] as Address);
        console.log('Market Info Tests:', marketInfoResult ? 'PASSED' : 'FAILED');

        // Test Rewards
        console.log('\nTesting Rewards...');
        const rewardsResult = await testClaimRewards(
            'ethereum',
            '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as Address,
            VALID_MARKETS[0] as Address
        );
        console.log('Rewards Tests:', rewardsResult ? 'PASSED' : 'FAILED');

        // Test Router Functions
        console.log('\nTesting Router Functions...');
        const routerResult = await testInitialize(
            VALID_MARKETS[0] as Address,
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address
        );
        console.log('Router Tests:', routerResult ? 'PASSED' : 'FAILED');

        // Test Market Oracle Functions
        console.log('\nTesting Market Oracle Functions...');
        const marketOracleResult = await testMarketOracle(VALID_MARKETS[0]);
        console.log('Market Oracle Tests:', marketOracleResult ? 'PASSED' : 'FAILED');

        // Test Fee Distributor V2 Functions
        console.log('\nTesting Fee Distributor V2 Functions...');
        const feeDistributorV2Result = await testFeeDistributorV2Actions(
            '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as Address
        );
        console.log('Fee Distributor V2 Tests:', feeDistributorV2Result ? 'PASSED' : 'FAILED');

        // Test Limit Order Functions
        console.log('\nTesting Limit Order Functions...');
        const limitOrderResult = await testLimitOrders(
            '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as Address
        );
        console.log('Limit Order Tests:', limitOrderResult ? 'PASSED' : 'FAILED');

        // Test Add/Remove Liquidity Functions
        console.log('\nTesting Add/Remove Liquidity Functions...');
        const addRemoveLiqResult = await testAddRemoveLiquidity(
            '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as Address
        );
        console.log('Add/Remove Liquidity Tests:', addRemoveLiqResult ? 'PASSED' : 'FAILED');

        console.log('\nAll integration tests completed.');
    } catch (error) {
        console.error('Integration Test Error:', error);
    }
}

// Run the integration tests
testIntegration().catch(console.error); 