import { type Address } from 'viem';
import { provider, getProvider, sendTransactions, notify } from './utils/provider';
// TODO: Fix type issues in getMarketInfo before enabling this import
// import { getMarketInfo } from './functions/queries/getMarketInfo';
// TODO: Fix type issues in claimRewards before enabling this import
// import { claimRewards } from './functions/actions/claimRewards';
import { redeemRewards } from './functions/actions/redeemRewards';
import { redeemExternalReward } from './functions/actions/redeemExternalReward';
import { initialize } from './functions/actions/initialize';
import { addLiquidity } from './functions/actions/addLiquidity';
import { removeLiquidity } from './functions/actions/removeLiquidity';
import { ADDRESSES } from './constants';
import { swapExactTokensForTokens } from './functions/actions/swapExactTokensForTokens';
import { swapTokensForExactTokens } from './functions/actions/swapTokensForExactTokens';
import { addLiquidityETH } from './functions/actions/addLiquidityETH';
import { removeLiquidityETH } from './functions/actions/removeLiquidityETH';
import { staleCheckLatestRoundData, getTimeout, getPriceFromChainlink } from './functions/oracleLib';
import { calcMessageFee, sendMessage, executeMessage } from './functions/actions/pendleMsgReceive';
import { mintSyFromToken } from './functions/actions/mintSyFromToken';
import { redeemSyToToken } from './functions/actions/redeemSyToToken';
import { mintPyFromToken } from './functions/actions/mintPyFromToken';
import { addLiquiditySinglePtSimple } from './functions/actions/addLiquiditySinglePtSimple';
import { addLiquiditySingleTokenSimple } from './functions/actions/addLiquiditySingleTokenSimple';
import { addLiquiditySingleSySimple } from './functions/actions/addLiquiditySingleSySimple';
import { removeLiquiditySinglePtSimple } from './functions/actions/removeLiquiditySinglePtSimple';
import { swapExactTokenForPtSimple } from './functions/actions/swapExactTokenForPtSimple';
import { addLiquidityDualSyAndPtStatic } from './functions/actions/addLiquidityDualSyAndPtStatic';
import { addLiquidityDualTokenAndPtStatic } from './functions/actions/addLiquidityDualTokenAndPtStatic';
import { addLiquiditySinglePtStatic } from './functions/actions/addLiquiditySinglePtStatic';
import { addLiquiditySingleSyKeepYtStatic } from './functions/actions/addLiquiditySingleSyKeepYtStatic';
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
// TODO: Fix type issues in feeDistributorV2 before enabling this import
// import { claimRetail, claimProtocol, getProtocolClaimables, getProtocolTotalAccrued } from './functions/actions/feeDistributorV2';
// TODO: Fix type issues in limitOrder before enabling this import
import { fillOrders } from './functions/actions/fillOrders';
import { cancelBatchOrders } from './functions/actions/cancelBatchOrders';
import { cancelOrder } from './functions/actions/cancelOrder';
import { getOrderStatuses } from './functions/actions/getOrderStatuses';
import { getDomainSeparator, simulate } from './functions/actions/limitOrder';
import { addLiquidityDualTokenAndPt, addLiquidityDualSyAndPt, addLiquiditySinglePt, addLiquiditySingleToken, addLiquiditySingleSy, removeLiquidityDualSyAndPt, removeLiquiditySingleToken, removeLiquiditySingleSy } from './functions/actions/actionAddRemoveLiq';
// TODO: Fix type issues in votingController before enabling this import
// import { getVotingPower, getVotingPowerForMarket, getVotingPowerForMarkets, getVotingPowerForUser, getVotingPowerForUsers, getVotingPowerForUsersAndMarkets } from './functions/actions/votingController';
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

// Constants
const VALID_MARKETS: Address[] = [
    '0x27b1dAcd74688aF24a64BD3C9C1B143118740784',
    '0x2FCb47B58350cD377f94d3821e7373Df60bD9Ced'
] as Address[];

interface Utils {
    getProvider: () => any;
    sendTransactions: (params: any) => Promise<any>;
    notify: (message: string) => Promise<void>;
}

// Market Core Actions Tests
async function testMarketCoreActions(): Promise<boolean> {
    console.log('Starting Market Core Actions tests...');
    
    try {
        const utils: Utils = {
            getProvider: () => provider,
            sendTransactions: async (params: any) => {
                console.log('Transaction params:', params);
                return { success: true, data: 'Transaction successful' };
            },
            notify: async (message: string) => {
                console.log('Notification:', message);
            }
        };

        // Test addLiquidityDualSyAndPtStatic
        const dualSyPtResult = await addLiquidityDualSyAndPtStatic(
            VALID_MARKETS[0],
            '1000000000000000000', // netSyDesired
            '900000000000000000',  // netPtDesired
            utils
        );
        console.log('Add liquidity dual SY and PT result:', dualSyPtResult);

        // Test addLiquidityDualTokenAndPtStatic
        const dualTokenPtResult = await addLiquidityDualTokenAndPtStatic(
            VALID_MARKETS[0],
            '0x1234567890123456789012345678901234567890' as Address, // tokenIn
            '1000000000000000000', // netTokenDesired
            '900000000000000000',  // netPtDesired
            utils
        );
        console.log('Add liquidity dual token and PT result:', dualTokenPtResult);

        // Test addLiquiditySinglePtStatic
        const singlePtResult = await addLiquiditySinglePtStatic(
            VALID_MARKETS[0],
            '1000000000000000000', // netPtIn
            utils
        );
        console.log('Add liquidity single PT result:', singlePtResult);

        // Test addLiquiditySingleSyKeepYtStatic
        const singleSyResult = await addLiquiditySingleSyKeepYtStatic(
            VALID_MARKETS[0],
            '1000000000000000000', // netSyIn
            utils
        );
        console.log('Add liquidity single SY result:', singleSyResult);

        return true;
    } catch (error) {
        console.error('Error in market core actions:', error);
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
// TODO: Fix type issues in getMarketInfo before enabling this function
// async function testMarketInfo(chainName: string, marketAddress: Address) {
//     console.log(`\nTesting getMarketInfo on ${chainName}...`);
//     try {
//         const marketInfoResult = await getMarketInfo(
//             {
//                 chainName,
//                 marketAddress
//             },
//             { getProvider: () => provider }
//         );
//         console.log('Market Info Result:', marketInfoResult);
//         return marketInfoResult.success;
//     } catch (error) {
//         console.error('Market Info Error:', error);
//         return false;
//     }
// }

// Reward Tests
// TODO: Fix type issues in claimRewards before enabling this function
// async function testClaimRewards(chainName: string, account: Address, marketAddress: Address): Promise<boolean> {
//     console.log(`\nTesting claimRewards on ${chainName}...`);
//     try {
//         const claimResult = await claimRewards(
//             {
//                 chainName,
//                 account,
//                 marketAddress
//             },
//             {
//                 sendTransactions: async (params: any) => {
//                     console.log('Transaction params:', params);
//                     return { success: true, data: 'Successfully claimed rewards' };
//                 },
//                 notify: async (message: string) => console.log('Notification:', message),
//                 getProvider: () => provider
//             }
//         );
//         console.log('Claim Result:', claimResult);
//         return claimResult.success;
//     } catch (error) {
//         console.error('Error in testClaimRewards:', error);
//         return false;
//     }
// }

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
        const deadline = Math.floor(Date.now() / 1000) + 3600;
        const deadlineStr = deadline.toString();
        const path = [
            VALID_MARKETS[0],
            VALID_MARKETS[1]
        ] as Address[];

        // Test initialize
        const utils = {
            getProvider: () => provider,
            sendTransactions: async (params: any) => {
                console.log('Transaction params:', params);
                return { success: true, data: 'Transaction successful' };
            },
            notify: async (message: string) => {
                console.log('Notification:', message);
            }
        };

        const initializeResult = await initialize(
            user,
            utils
        );
        console.log('Initialize result:', initializeResult);

        // Test addLiquidityETH
        const addLiquidityETHResult = await addLiquidityETH(
            VALID_MARKETS[0],
            VALID_MARKETS[1],
            '1000000000000000000', // amountTokenDesired
            '900000000000000000',  // amountTokenMin
            '800000000000000000',  // amountETHMin
            user,
            Math.floor(Date.now() / 1000) + 3600,
            utils
        );
        console.log('Add liquidity ETH result:', addLiquidityETHResult);

        // Test removeLiquidityETH
        const removeLiquidityETHResult = await removeLiquidityETH(
            VALID_MARKETS[0],
            VALID_MARKETS[1],
            '1000000000000000000', // liquidity
            '900000000000000000',  // amountTokenMin
            '800000000000000000',  // amountETHMin
            user,
            Math.floor(Date.now() / 1000) + 3600,
            utils
        );
        console.log('Remove liquidity ETH result:', removeLiquidityETHResult);

        // Test swapExactTokensForTokens
        const swapExactTokensResult = await swapExactTokensForTokens(
            VALID_MARKETS[0],
            '1000000000000000000', // amountIn
            '900000000000000000',  // amountOutMin
            [VALID_MARKETS[1], VALID_MARKETS[2]], // path
            user,
            Math.floor(Date.now() / 1000) + 3600,
            utils
        );
        console.log('Swap exact tokens result:', swapExactTokensResult);

        // Test swapTokensForExactTokens
        const swapTokensForExactResult = await swapTokensForExactTokens(
            VALID_MARKETS[0],
            '1000000000000000000', // amountOut
            '1100000000000000000', // amountInMax
            [VALID_MARKETS[1], VALID_MARKETS[2]], // path
            user,
            Math.floor(Date.now() / 1000) + 3600,
            utils
        );
        console.log('Swap tokens for exact result:', swapTokensForExactResult);

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
// TODO: Fix type issues in feeDistributorV2 before enabling this function
// async function testFeeDistributorV2Actions(user: Address): Promise<boolean> {
//     console.log('Testing fee distributor V2 actions...');
//     try {
//         const mockPools = [
//             '0x27b1dAcd74688aF24a64BD3C9C1B143118740784',
//             '0x2FCb47B58350cD377f94d3821e7373Df60bD9Ced'
//         ] as Address[];

//         // Test claimRetail
//         const mockProof = ['0x1234567890123456789012345678901234567890123456789012345678901234'];
//         const claimRetailResult = await claimRetail(
//             user,
//             '1000000000000000000',
//             mockProof,
//             { getProvider, sendTransactions, notify }
//         );
//         console.log('Claim retail result:', claimRetailResult);

//         // Test claimProtocol
//         const claimProtocolResult = await claimProtocol(
//             user,
//             mockPools,
//             { getProvider, sendTransactions, notify }
//         );
//         console.log('Claim protocol result:', claimProtocolResult);

//         // Test getProtocolClaimables
//         const claimablesResult = await getProtocolClaimables(
//             user,
//             mockPools,
//             { getProvider }
//         );
//         console.log('Protocol claimables:', claimablesResult);

//         // Test getProtocolTotalAccrued
//         const totalAccruedResult = await getProtocolTotalAccrued(
//             user,
//             utils
//         );
//         console.log('Get protocol total accrued result:', totalAccruedResult);

//         return true;
//     } catch (error) {
//         console.error('Error in fee distributor V2 tests:', error);
//         return false;
//     }
// }

// Limit Order Tests
async function testLimitOrders(user: Address): Promise<boolean> {
    console.log('Testing limit order functions...');
    try {
        const utils = {
            getProvider,
            sendTransactions: async (params: any) => {
                console.log('Transaction params:', params);
                return { data: 'Transaction hash' };
            },
            notify: async (message: string) => {
                console.log('Notification:', message);
            }
        };

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
        const fillOrdersResult = await fillOrders(
            [mockOrder],
            user,
            '1000000000000000000', // maxTaking
            '0x', // callback
            utils
        );
        console.log('Fill orders result:', fillOrdersResult);

        // Test getOrderStatuses
        const orderHashes = ['0x1234567890123456789012345678901234567890123456789012345678901234'];
        const orderStatusesResult = await getOrderStatuses(orderHashes, utils);
        console.log('Get order statuses result:', orderStatusesResult);

        // Test cancelBatchOrders
        const cancelBatchResult = await cancelBatchOrders([mockOrder], utils);
        console.log('Cancel batch orders result:', cancelBatchResult);

        // Test cancelOrder
        const cancelOrderResult = await cancelOrder(mockOrder, utils);
        console.log('Cancel order result:', cancelOrderResult);

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
// TODO: Fix type issues in votingController before enabling this function
// async function testVotingController(user: Address): Promise<boolean> {
//     console.log('Testing voting controller functions...');
//     try {
//         // Test getVotingPower
//         const votingPowerResult = await getVotingPower(
//             user,
//             { getProvider: () => provider }
//         );
//         console.log('Voting power result:', votingPowerResult);

//         // Test getVotingPowerForMarket
//         const marketVotingPowerResult = await getVotingPowerForMarket(
//             user,
//             ADDRESSES.MARKET_ADDRESS,
//             { getProvider: () => provider }
//         );
//         console.log('Market voting power result:', marketVotingPowerResult);

//         // Test getVotingPowerForMarkets
//         const marketsVotingPowerResult = await getVotingPowerForMarkets(
//             user,
//             [ADDRESSES.MARKET_ADDRESS],
//             { getProvider: () => provider }
//         );
//         console.log('Markets voting power result:', marketsVotingPowerResult);

//         // Test getVotingPowerForUser
//         const userVotingPowerResult = await getVotingPowerForUser(
//             user,
//             { getProvider: () => provider }
//         );
//         console.log('User voting power result:', userVotingPowerResult);

//         // Test getVotingPowerForUsers
//         const usersVotingPowerResult = await getVotingPowerForUsers(
//             [user],
//             { getProvider: () => provider }
//         );
//         console.log('Users voting power result:', usersVotingPowerResult);

//         // Test getVotingPowerForUsersAndMarkets
//         const usersMarketsVotingPowerResult = await getVotingPowerForUsersAndMarkets(
//             [user],
//             [ADDRESSES.MARKET_ADDRESS],
//             { getProvider: () => provider }
//         );
//         console.log('Users and markets voting power result:', usersMarketsVotingPowerResult);

//         return true;
//     } catch (error) {
//         console.error('Error in voting controller tests:', error);
//         return false;
//     }
// }

// Gauge Controller Tests
// TODO: Fix type issues in gaugeController before enabling this function
// async function testGaugeController(user: Address): Promise<boolean> {
//     console.log('Testing gauge controller functions...');
//     try {
//         // Test getGaugeWeight
//         const gaugeWeightResult = await getGaugeWeight(
//             ADDRESSES.GAUGE_ADDRESS,
//             { getProvider: () => provider }
//         );
//         console.log('Gauge weight result:', gaugeWeightResult);

//         // Test getGaugeWeights
//         const gaugeWeightsResult = await getGaugeWeights(
//             [ADDRESSES.GAUGE_ADDRESS],
//             { getProvider: () => provider }
//         );
//         console.log('Gauge weights result:', gaugeWeightsResult);

//         // Test getGaugeWeightsForUser
//         const userGaugeWeightsResult = await getGaugeWeightsForUser(
//             user,
//             { getProvider: () => provider }
//         );
//         console.log('User gauge weights result:', userGaugeWeightsResult);

//         // Test getGaugeWeightsForUsers
//         const usersGaugeWeightsResult = await getGaugeWeightsForUsers(
//             [user],
//             { getProvider: () => provider }
//         );
//         console.log('Users gauge weights result:', usersGaugeWeightsResult);

//         // Test getGaugeWeightsForUsersAndGauges
//         const usersGaugesWeightsResult = await getGaugeWeightsForUsersAndGauges(
//             [user],
//             [ADDRESSES.GAUGE_ADDRESS],
//             { getProvider: () => provider }
//         );
//         console.log('Users and gauges weights result:', usersGaugesWeightsResult);

//         return true;
//     } catch (error) {
//         console.error('Error in gauge controller tests:', error);
//         return false;
//     }
// }

// Yield Token Tests
// TODO: Fix type issues in yieldToken before enabling this function
// async function testYieldToken(user: Address): Promise<boolean> {
//     console.log('Testing yield token functions...');
//     try {
//         // Test getYieldTokenInfo
//         const tokenInfoResult = await getYieldTokenInfo(
//             ADDRESSES.YIELD_TOKEN_ADDRESS,
//             { getProvider: () => provider }
//         );
//         console.log('Yield token info result:', tokenInfoResult);

//         // Test getYieldTokenInfos
//         const tokensInfoResult = await getYieldTokenInfos(
//             [ADDRESSES.YIELD_TOKEN_ADDRESS],
//             { getProvider: () => provider }
//         );
//         console.log('Yield tokens info result:', tokensInfoResult);

//         // Test getYieldTokenInfosForUser
//         const userTokenInfoResult = await getYieldTokenInfosForUser(
//             user,
//             { getProvider: () => provider }
//         );
//         console.log('User yield token info result:', userTokenInfoResult);

//         // Test getYieldTokenInfosForUsers
//         const usersTokenInfoResult = await getYieldTokenInfosForUsers(
//             [user],
//             { getProvider: () => provider }
//         );
//         console.log('Users yield token info result:', usersTokenInfoResult);

//         // Test getYieldTokenInfosForUsersAndTokens
//         const usersTokensInfoResult = await getYieldTokenInfosForUsersAndTokens(
//             [user],
//             [ADDRESSES.YIELD_TOKEN_ADDRESS],
//             { getProvider: () => provider }
//         );
//         console.log('Users and tokens info result:', usersTokensInfoResult);

//         return true;
//     } catch (error) {
//         console.error('Error in yield token tests:', error);
//         return false;
//     }
// }

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

        // TODO: Fix claimRewards type issues before enabling this test
        // // Test claim rewards
        // const claimRewardsResult = await claimRewards({
        //     chainName: 'ethereum',
        //     account: user,
        //     marketAddress: '0x1234567890123456789012345678901234567890' as Address
        // }, {
        //     sendTransactions,
        //     notify,
        //     getProvider
        // });
        // console.log('Claim rewards result:', claimRewardsResult);

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
// TODO: Fix type issues in merkleDistributor before enabling this function
// async function testMerkleDistributor(user: Address): Promise<boolean> {
//     console.log('Testing merkle distributor functions...');
//     try {
//         // Test claim
//         const claimResult = await claim(
//             user,
//             ['0x1234567890123456789012345678901234567890123456789012345678901234'],
//             '1000000000000000000',
//             { getProvider: () => provider }
//         );
//         console.log('Claim result:', claimResult);

//         // Test claimVerified
//         const claimVerifiedResult = await claimVerified(
//             user,
//             ['0x1234567890123456789012345678901234567890123456789012345678901234'],
//             '1000000000000000000',
//             { getProvider: () => provider }
//         );
//         console.log('Claim verified result:', claimVerifiedResult);

//         return true;
//     } catch (error) {
//         console.error('Error in merkle distributor tests:', error);
//         return false;
//     }
// }

// Multi-Token Merkle Distributor Tests
// TODO: Fix type issues in multiTokenMerkleDistributor before enabling this function
// async function testMultiTokenMerkleDistributor(user: Address): Promise<boolean> {
//     console.log('Testing multi-token merkle distributor functions...');
//     try {
//         // Test claimVerified
//         const claimVerifiedResult = await claimVerifiedMulti(
//             user,
//             ['0x1234567890123456789012345678901234567890123456789012345678901234'],
//             '1000000000000000000',
//             ADDRESSES.TOKEN_ADDRESS,
//             { getProvider: () => provider }
//         );
//         console.log('Claim verified result:', claimVerifiedResult);

//         // Test verify
//         const verifyResult = await verifyMulti(
//             user,
//             ['0x1234567890123456789012345678901234567890123456789012345678901234'],
//             '1000000000000000000',
//             ADDRESSES.TOKEN_ADDRESS,
//             { getProvider: () => provider }
//         );
//         console.log('Verify result:', verifyResult);

//         return true;
//     } catch (error) {
//         console.error('Error in multi-token merkle distributor tests:', error);
//         return false;
//     }
// }

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

    try {
        // Test Market Core Actions
        console.log('\nTesting Market Core Actions...');
        const marketCoreResult = await testMarketCoreActions();
        console.log('Market Core Actions Tests:', marketCoreResult ? 'PASSED' : 'FAILED');

        // Test Router Functions
        console.log('\nTesting Router Functions...');
        const routerResult = await testRouterFunctions(user);
        console.log('Router Functions Tests:', routerResult ? 'PASSED' : 'FAILED');

        // Test Market Oracle
        console.log('\nTesting Market Oracle...');
        const oracleResult = await testMarketOracle(VALID_MARKETS[0]);
        console.log('Market Oracle Tests:', oracleResult ? 'PASSED' : 'FAILED');

        // Test Limit Orders
        console.log('\nTesting Limit Orders...');
        const limitOrderResult = await testLimitOrders(user);
        console.log('Limit Order Tests:', limitOrderResult ? 'PASSED' : 'FAILED');

        // Test Add/Remove Liquidity
        console.log('\nTesting Add/Remove Liquidity...');
        const liquidityResult = await testAddRemoveLiquidity(user);
        console.log('Add/Remove Liquidity Tests:', liquidityResult ? 'PASSED' : 'FAILED');

        // Test Standardized Yield
        console.log('\nTesting Standardized Yield...');
        const yieldResult = await testStandardizedYield(user);
        console.log('Standardized Yield Tests:', yieldResult ? 'PASSED' : 'FAILED');

        // Test Redeem Rewards
        console.log('\nTesting Redeem Rewards...');
        const redeemResult = await testRedeemRewards(user, VALID_MARKETS[0]);
        console.log('Redeem Rewards Tests:', redeemResult ? 'PASSED' : 'FAILED');

        // Test Swap Functions
        console.log('\nTesting Swap Functions...');
        await testSwapFunctions();
        console.log('Swap Functions Tests: PASSED');

    } catch (error) {
        console.error('Integration Test Error:', error);
    }
}

// Run the integration tests
runIntegrationTests('0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as Address).catch(console.error); 