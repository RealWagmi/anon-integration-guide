import { type Address } from 'viem';
import { provider, getProvider, sendTransactions, notify } from './utils/provider';
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
import {
    vote,
    applyPoolSlopeChanges,
    getWeekData,
    getPoolTotalVoteAt,
    finalizeEpoch,
    getBroadcastResultFee,
    broadcastResults
} from './functions/actions/votingController';
import {
    fundPendle,
    withdrawPendle,
    getPendleAddress,
    redeemMarketReward,
    getRewardData
} from './functions/actions/gaugeController';
import {
    mintPY,
    redeemPY,
    redeemPYMulti,
    redeemDueInterestAndRewards
} from './functions/actions/yieldToken';
import {
    deposit,
    redeem,
    getExchangeRate,
    getAccruedRewards,
    getRewardTokens,
    getYieldToken,
    getTokensIn,
    getTokensOut,
    isValidTokenIn,
    isValidTokenOut,
    previewDeposit,
    previewRedeem
} from './functions/actions/standardizedYield';
import {
    claim,
    claimVerified,
    verify,
    type ClaimParams
} from './functions/actions/merkleDistributor';
import {
    claimMultiToken,
    claimVerifiedMultiToken,
    verifyMultiToken
} from './functions/actions/multiTokenMerkleDistributor';
import {
    swapExactTokenForPt,
    swapExactSyForPt,
    swapExactPtForToken
} from './functions/actions/swapFunctions';
import { type Result } from './types';

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

interface TransactionParams {
    transactions: { target: string; data: any; value?: bigint }[];
}

interface TransactionResult {
    success: boolean;
    data: string;
}

interface TestCallbacks {
    sendTransactions: (params: TransactionParams) => Promise<TransactionResult>;
    notify: (message: string) => Promise<void>;
    getProvider: () => typeof provider;
}

const mockCallbacks: TestCallbacks = {
    sendTransactions: async (params: TransactionParams): Promise<TransactionResult> => {
        console.log('Transaction params:', params);
        return { success: true, data: 'Transaction successful' };
    },
    notify: async (message: string): Promise<void> => {
        console.log('Notification:', message);
    },
    getProvider: () => provider
};

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
async function testClaimRewards(chainName: string, account: Address, marketAddress: Address): Promise<boolean> {
    console.log(`\nTesting claimRewards on ${chainName}...`);
    try {
        const claimResult = await claimRewards(
            {
                chainName,
                account,
                marketAddress
            },
            mockCallbacks
        );
        console.log('Claim Result:', claimResult);
        return claimResult.success;
    } catch (error) {
        console.error('Error in testClaimRewards:', error);
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
async function testRouterFunctions(user: Address): Promise<boolean> {
    console.log('Testing router functions...');
    try {
        const factory = '0x1234567890123456789012345678901234567890' as Address;
        const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as Address;
        const token = '0x2FCb47B58350cD377f94d3821e7373Df60bD9Ced' as Address;
        const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

        // Test initialize
        const initializeResult = await initialize(factory, WETH, {
            sendTransactions: async (params: any) => {
                console.log('Transaction params:', params);
                return { success: true, data: 'Router initialized successfully' };
            },
            notify: async (message: string) => console.log('Notification:', message),
            getProvider: () => provider
        });
        console.log('Initialize result:', initializeResult);

        // Test addLiquidityETH
        const addLiquidityETHResult = await addLiquidityETH(
            token,
            '1000000000000000000', // 1 token
            '900000000000000000',  // min 0.9 token
            '1000000000000000000', // min 1 ETH
            user,
            deadline,
            {
                sendTransactions: async (params: any) => {
                    console.log('Transaction params:', params);
                    return {
                        success: true,
                        data: {
                            amountToken: '1000000000000000000',
                            amountETH: '1000000000000000000',
                            liquidity: '1000000000000000000'
                        }
                    };
                },
                notify: async (message: string) => console.log('Notification:', message),
                getProvider: () => provider
            }
        );
        console.log('Add Liquidity ETH result:', addLiquidityETHResult);

        // Test removeLiquidityETH
        const removeLiquidityETHResult = await removeLiquidityETH(
            token,
            '1000000000000000000', // 1 LP token
            '900000000000000000',  // min 0.9 token
            '900000000000000000',  // min 0.9 ETH
            user,
            deadline,
            {
                sendTransactions: async (params: any) => {
                    console.log('Transaction params:', params);
                    return {
                        success: true,
                        data: {
                            amountToken: '1000000000000000000',
                            amountETH: '1000000000000000000'
                        }
                    };
                },
                notify: async (message: string) => console.log('Notification:', message),
                getProvider: () => provider
            }
        );
        console.log('Remove Liquidity ETH result:', removeLiquidityETHResult);

        // Test swapExactTokensForTokens
        const path = [token, WETH] as Address[];
        const swapExactResult = await swapExactTokensForTokens(
            '1000000000000000000', // 1 token in
            '900000000000000000',  // min 0.9 token out
            path,
            user,
            deadline,
            {
                sendTransactions: async (params: any) => {
                    console.log('Transaction params:', params);
                    return {
                        success: true,
                        data: {
                            amounts: ['1000000000000000000', '950000000000000000']
                        }
                    };
                },
                notify: async (message: string) => console.log('Notification:', message),
                getProvider: () => provider
            }
        );
        console.log('Swap Exact Tokens result:', swapExactResult);

        // Test swapTokensForExactTokens
        const swapExactOutResult = await swapTokensForExactTokens(
            '1000000000000000000', // 1 token out
            '1100000000000000000', // max 1.1 token in
            path,
            user,
            deadline,
            {
                sendTransactions: async (params: any) => {
                    console.log('Transaction params:', params);
                    return {
                        success: true,
                        data: {
                            amounts: ['1050000000000000000', '1000000000000000000']
                        }
                    };
                },
                notify: async (message: string) => console.log('Notification:', message),
                getProvider: () => provider
            }
        );
        console.log('Swap Tokens For Exact result:', swapExactOutResult);

        return true;
    } catch (error) {
        console.error('Error in router function tests:', error);
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

// Voting Controller Tests
async function testVotingController(user: Address): Promise<boolean> {
    console.log('Testing voting controller functions...');

    try {
        // Test vote function
        const voteResult = await vote(
            {
                pools: ['0x1234567890123456789012345678901234567890', '0x0987654321098765432109876543210987654321'],
                weights: [50, 50]
            },
            { getProvider, sendTransactions, notify }
        );
        console.log('Vote result:', voteResult);

        // Test applyPoolSlopeChanges function
        const applyResult = await applyPoolSlopeChanges(
            '0x1234567890123456789012345678901234567890',
            { getProvider, sendTransactions, notify }
        );
        console.log('Apply pool slope changes result:', applyResult);

        // Test getWeekData function
        const weekDataResult = await getWeekData(
            Math.floor(Date.now() / 1000),
            ['0x1234567890123456789012345678901234567890', '0x0987654321098765432109876543210987654321'],
            { getProvider }
        );
        console.log('Week data result:', weekDataResult);

        // Test getPoolTotalVoteAt function
        const poolVoteResult = await getPoolTotalVoteAt(
            '0x1234567890123456789012345678901234567890',
            Math.floor(Date.now() / 1000),
            { getProvider }
        );
        console.log('Pool total vote result:', poolVoteResult);

        // Test finalizeEpoch function
        const finalizeResult = await finalizeEpoch({ getProvider, sendTransactions, notify });
        console.log('Finalize epoch result:', finalizeResult);

        // Test getBroadcastResultFee function
        const feeResult = await getBroadcastResultFee(1, { getProvider });
        console.log('Broadcast result fee:', feeResult);

        // Test broadcastResults function
        const broadcastResult = await broadcastResults(1, { getProvider, sendTransactions, notify });
        console.log('Broadcast results result:', broadcastResult);

        return true;
    } catch (error) {
        console.error('Error testing voting controller functions:', error);
        return false;
    }
}

// Gauge Controller Tests
async function testGaugeController(): Promise<boolean> {
    console.log('Testing gauge controller functions...');

    try {
        // Test fundPendle function
        const fundResult = await fundPendle(
            '1000000000000000000',
            { getProvider, sendTransactions, notify }
        );
        console.log('Fund PENDLE result:', fundResult);

        // Test withdrawPendle function
        const withdrawResult = await withdrawPendle(
            '500000000000000000',
            { getProvider, sendTransactions, notify }
        );
        console.log('Withdraw PENDLE result:', withdrawResult);

        // Test getPendleAddress function
        const addressResult = await getPendleAddress({ getProvider });
        console.log('PENDLE address:', addressResult);

        // Test redeemMarketReward function
        const redeemResult = await redeemMarketReward({ getProvider, sendTransactions, notify });
        console.log('Redeem market reward result:', redeemResult);

        // Test getRewardData function
        const rewardDataResult = await getRewardData(
            '0x1234567890123456789012345678901234567890' as Address,
            { getProvider }
        );
        console.log('Reward data result:', rewardDataResult);

        return true;
    } catch (error) {
        console.error('Error testing gauge controller functions:', error);
        return false;
    }
}

// Yield Token Tests
async function testYieldToken(user: Address): Promise<boolean> {
    console.log('Testing yield token functions...');
    try {
        // Test mintPY
        const mintResult = await mintPY(
            user,
            user,
            { getProvider, sendTransactions, notify }
        );
        console.log('Mint PY result:', mintResult);

        // Test redeemPY
        const redeemResult = await redeemPY(
            user,
            { getProvider, sendTransactions, notify }
        );
        console.log('Redeem PY result:', redeemResult);

        // Test redeemPYMulti
        const receivers = [user, user];
        const amounts = ['1000000000000000000', '1000000000000000000'];
        const redeemMultiResult = await redeemPYMulti(
            receivers,
            amounts,
            { getProvider, sendTransactions, notify }
        );
        console.log('Redeem PY Multi result:', redeemMultiResult);

        // Test redeemDueInterestAndRewards
        const redeemRewardsResult = await redeemDueInterestAndRewards(
            user,
            true,
            true,
            { getProvider, sendTransactions, notify }
        );
        console.log('Redeem Due Interest and Rewards result:', redeemRewardsResult);

        return true;
    } catch (error) {
        console.error('Error testing yield token functions:', error);
        return false;
    }
}

// Standardized Yield Tests
async function testStandardizedYield(user: Address): Promise<boolean> {
    console.log('Testing Standardized Yield functions...');

    try {
        // Test deposit
        const depositResult = await deposit(
            user,
            '0x1234567890123456789012345678901234567890',
            '1000000000000000000',
            '900000000000000000',
            { getProvider, sendTransactions, notify }
        );
        console.log('Deposit result:', depositResult);

        // Test redeem
        const redeemResult = await redeem(
            user,
            '1000000000000000000',
            '0x1234567890123456789012345678901234567890',
            '900000000000000000',
            false,
            { getProvider, sendTransactions, notify }
        );
        console.log('Redeem result:', redeemResult);

        // Test exchange rate
        const exchangeRateResult = await getExchangeRate({ getProvider });
        console.log('Exchange rate:', exchangeRateResult);

        // Test claim rewards
        const claimRewardsResult = await claimRewards({
            chainName: 'ethereum',
            account: user,
            marketAddress: '0x1234567890123456789012345678901234567890' as Address
        }, {
            sendTransactions,
            notify,
            getProvider
        });
        console.log('Claim rewards result:', claimRewardsResult);

        // Test accrued rewards
        const accruedRewardsResult = await getAccruedRewards(user, { getProvider });
        console.log('Accrued rewards:', accruedRewardsResult);

        // Test get reward tokens
        const rewardTokensResult = await getRewardTokens({ getProvider });
        console.log('Reward tokens:', rewardTokensResult);

        // Test get yield token
        const yieldTokenResult = await getYieldToken({ getProvider });
        console.log('Yield token:', yieldTokenResult);

        // Test get tokens in
        const tokensInResult = await getTokensIn({ getProvider });
        console.log('Tokens in:', tokensInResult);

        // Test get tokens out
        const tokensOutResult = await getTokensOut({ getProvider });
        console.log('Tokens out:', tokensOutResult);

        // Test is valid token in
        const isValidTokenInResult = await isValidTokenIn('0x1234567890123456789012345678901234567890', { getProvider });
        console.log('Is valid token in:', isValidTokenInResult);

        // Test is valid token out
        const isValidTokenOutResult = await isValidTokenOut('0x1234567890123456789012345678901234567890', { getProvider });
        console.log('Is valid token out:', isValidTokenOutResult);

        // Test preview deposit
        const previewDepositResult = await previewDeposit(
            '0x1234567890123456789012345678901234567890',
            '1000000000000000000',
            { getProvider }
        );
        console.log('Preview deposit:', previewDepositResult);

        // Test preview redeem
        const previewRedeemResult = await previewRedeem(
            '0x1234567890123456789012345678901234567890',
            '1000000000000000000',
            { getProvider }
        );
        console.log('Preview redeem:', previewRedeemResult);

        return true;
    } catch (error) {
        console.error('Error testing standardized yield functions:', error);
        return false;
    }
}

// Cross-Chain Messaging Tests
async function testCrossChainMessaging(): Promise<void> {
    const endpointAddress = '0x1234...' as Address;
    const dstAddress = '0x5678...' as Address;
    const dstChainId = 1;
    const message = '0x';
    const estimatedGasAmount = 100000;

    const sendResult = await sendMessage(
        endpointAddress,
        {
            dstAddress,
            dstChainId,
            payload: message,
            estimatedGasAmount
        },
        mockCallbacks
    );
    console.log('Send message result:', sendResult);
}

// Merkle Distributor Tests
async function testMerkleDistributor() {
    const testAccount = '0x1234567890123456789012345678901234567890' as Address;
    const merkleProof = ['0x123...'] as string[];

    // Test claim
    const claimResult = await claim(
        {
            chainName: 'ethereum',
            account: testAccount,
            merkleProof,
            amount: BigInt(1000)
        },
        mockCallbacks
    );
    console.log('Claim result:', claimResult);

    // Test claimVerified
    const claimVerifiedResult = await claimVerified(
        {
            chainName: 'ethereum',
            account: testAccount,
            merkleProof,
            amount: BigInt(1000)
        },
        mockCallbacks
    );
    console.log('Claim verified result:', claimVerifiedResult);

    // Test verify
    const verifyResult = await verify(
        {
            chainName: 'ethereum',
            account: testAccount,
            merkleProof,
            amount: BigInt(1000)
        },
        { getProvider: mockCallbacks.getProvider }
    );
    console.log('Verify result:', verifyResult);
}

// Multi-Token Merkle Distributor Tests
async function testMultiTokenMerkleDistributor() {
    const testAccount = '0x1234567890123456789012345678901234567890' as Address;
    const merkleProof = ['0x123...'] as string[];
    const tokens = [
        '0x1111111111111111111111111111111111111111',
        '0x2222222222222222222222222222222222222222'
    ] as Address[];
    const amounts = [BigInt(1000), BigInt(2000)];

    // Test claimMultiToken
    const claimResult = await claimMultiToken({
        chainName: 'ethereum',
        account: testAccount,
        merkleProof,
        tokens,
        amounts
    }, {
        getProvider,
        sendTransactions,
        notify
    });
    console.log('Multi-token claim result:', claimResult);

    // Test claimVerifiedMultiToken
    const claimVerifiedResult = await claimVerifiedMultiToken({
        chainName: 'ethereum',
        account: testAccount,
        merkleProof,
        tokens,
        amounts
    }, {
        getProvider,
        sendTransactions,
        notify
    });
    console.log('Multi-token claim verified result:', claimVerifiedResult);

    // Test verifyMultiToken
    const verifyResult = await verifyMultiToken({
        chainName: 'ethereum',
        account: testAccount,
        merkleProof,
        tokens,
        amounts
    }, {
        getProvider
    });
    console.log('Multi-token verify result:', verifyResult);
}

// Swap Function Tests
async function testSwapFunctions() {
    const testAccount = '0x1234567890123456789012345678901234567890' as Address;
    const tokenIn = '0x1111111111111111111111111111111111111111' as Address;
    const tokenOut = '0x2222222222222222222222222222222222222222' as Address;
    const swapParams = {
        chainName: 'ethereum',
        account: testAccount,
        tokenIn,
        tokenOut,
        amountIn: BigInt(1000),
        amountOutMin: BigInt(900),
        deadline: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
    };

    // Test swapExactTokenForPt
    const tokenSwapResult = await swapExactTokenForPt(
        swapParams,
        {
            getProvider,
            sendTransactions,
            notify
        }
    );
    console.log('Token swap result:', tokenSwapResult);

    // Test swapExactSyForPt
    const sySwapResult = await swapExactSyForPt(
        swapParams,
        {
            getProvider,
            sendTransactions,
            notify
        }
    );
    console.log('SY swap result:', sySwapResult);

    // Test swapExactPtForToken
    const ptSwapResult = await swapExactPtForToken(
        swapParams,
        {
            getProvider,
            sendTransactions,
            notify
        }
    );
    console.log('PT swap result:', ptSwapResult);
}

// Main Integration Test
export async function runIntegrationTests(user: Address): Promise<void> {
    console.log('Starting integration tests...\n');

    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    const VALID_MARKETS = [
        '0x27b1dAcd74688aF24a64BD3C9C1B143118740784',
        '0x2FCb47B58350cD377f94d3821e7373Df60bD9Ced'
    ];

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
        const routerTestResult = await testRouterFunctions(user);
        console.log('Router function tests completed:', routerTestResult);

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

        // Test Voting Controller Functions
        console.log('\nTesting Voting Controller Functions...');
        const votingControllerTestResult = await testVotingController(user);
        console.log('Voting controller tests completed:', votingControllerTestResult);

        // Test Gauge Controller Functions
        console.log('\nTesting Gauge Controller Functions...');
        const gaugeControllerTestResult = await testGaugeController();
        console.log('Gauge controller tests completed:', gaugeControllerTestResult);

        // Test Yield Token Functions
        console.log('\nTesting Yield Token Functions...');
        const yieldTokenTestResult = await testYieldToken(user);
        console.log('Yield token tests completed:', yieldTokenTestResult);

        // Test Standardized Yield Functions
        console.log('\nTesting Standardized Yield Functions...');
        const standardizedYieldTestResult = await testStandardizedYield(user);
        console.log('Standardized yield test result:', standardizedYieldTestResult);

        // Test Cross-Chain Messaging
        console.log('\nTesting Cross-Chain Messaging Functions...');
        const messagingTestResult = await testCrossChainMessaging();
        console.log('Cross-chain messaging tests completed:', messagingTestResult);

        // Test Merkle Distributor Functions
        console.log('\nTesting Merkle Distributor Functions...');
        const merkleDistributorResult = await testMerkleDistributor();
        console.log('Merkle Distributor tests completed:', merkleDistributorResult);

        // Test Multi-Token Merkle Distributor Functions
        console.log('\nTesting Multi-Token Merkle Distributor Functions...');
        const multiTokenMerkleResult = await testMultiTokenMerkleDistributor();
        console.log('Multi-Token Merkle Distributor tests completed:', multiTokenMerkleResult);

        // Test Swap Functions
        console.log('\nTesting Swap Functions...');
        const swapFunctionsResult = await testSwapFunctions();
        console.log('Swap function tests completed:', swapFunctionsResult);

        console.log('\nAll integration tests completed.');
    } catch (error) {
        console.error('Integration Test Error:', error);
    }
}

// Run the integration tests
runIntegrationTests('0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as Address).catch(console.error); 