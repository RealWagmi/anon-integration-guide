import { type Address } from 'viem';

// Mock provider for testing
export const provider = {
    request: async () => null,
    readContract: async (params: any) => {
        try {
            const { functionName } = params;
            
            // Validate market address for specific functions
            if (['isExpired', 'rewardData', 'isValidMarket', 'observe', '_storage', 'observations'].includes(functionName)) {
                if (params.address === '0x0000000000000000000000000000000000000000') {
                    throw new Error('Invalid market address: zero address');
                }

                const isKnownMarket = params.address === '0x27b1dAcd74688aF24a64BD3C9C1B143118740784' || 
                                    params.address === '0x2FCb47B58350cD377f94d3821e7373Df60bD9Ced';
                if (!isKnownMarket) {
                    throw new Error(`Invalid market address: ${params.address}`);
                }
            }
            
            // Mock responses for different function calls
            switch (functionName) {
                case 'isExpired':
                    return false;
                    
                case 'rewardData':
                    return {
                        pendlePerSec: 1000n,
                        accumulatedPendle: 5000n,
                        lastUpdated: BigInt(Date.now()),
                        incentiveEndsAt: BigInt(Date.now() + 86400000)
                    };
                    
                case 'isValidMarket':
                    return true;
                    
                case 'calcPriceImpactPY':
                case 'calcPriceImpactPt':
                case 'calcPriceImpactYt':
                    return 1000000000000000000n; // 1e18 representing 1.0 impact
                    
                case 'getMarketState':
                    return {
                        pt: '0x1234567890123456789012345678901234567890' as Address,
                        yt: '0x0987654321098765432109876543210987654321' as Address,
                        sy: '0xabcdef0123456789abcdef0123456789abcdef01' as Address,
                        impliedYield: 1000000000000000000n, // 1.0
                        marketExchangeRateExcludeFee: 1000000000000000000n,
                        state: {
                            totalPt: 1000000000000000000n,
                            totalSy: 1000000000000000000n,
                            totalLp: 1000000000000000000n,
                            treasury: 1000000000000000000n,
                            scalarRoot: 1000000000000000000n,
                            expiry: 1735689600n // Example timestamp
                        }
                    };
                    
                case 'getYieldTokenAndPtRate':
                case 'getYieldTokenAndYtRate':
                    return {
                        yieldToken: '0xabcdef0123456789abcdef0123456789abcdef01' as Address,
                        netPtOut: 1000000000000000000n
                    };
                    
                case 'getLpToSyRate':
                case 'pyIndexCurrentViewMarket':
                    return 1000000000000000000n;

                // Market Core Static functions
                case 'addLiquidityDualSyAndPtStatic':
                case 'addLiquidityDualTokenAndPtStatic':
                case 'addLiquiditySinglePtStatic':
                case 'addLiquiditySingleSyKeepYtStatic':
                    return {
                        netLpOut: 1000000000000000000n,
                        netSyFee: 0n,
                        netPtFee: 0n
                    };

                // Mint/Redeem Static functions
                case 'getAmountTokenToMintSy':
                    return 1000000000000000000n;

                case 'mintPyFromSyStatic':
                case 'mintPyFromTokenStatic':
                case 'mintSyFromTokenStatic':
                case 'redeemPyToSyStatic':
                case 'redeemPyToTokenStatic':
                case 'redeemSyToTokenStatic':
                    return {
                        netTokenOut: 1000000000000000000n,
                        netSyFee: 0n,
                        netPtFee: 0n
                    };

                // Message functions
                case 'calcFee':
                    return 1000000000000000n; // 0.001 ETH

                // Oracle functions
                case 'observe':
                    return params.args[0].map(() => 1000000000000000000n); // Mock rate of 1.0 for all timestamps

                case '_storage':
                    return {
                        totalPt: 1000000000000000000n,
                        totalSy: 1000000000000000000n,
                        lastLnImpliedRate: 1000000000000000000n,
                        observationIndex: 0,
                        observationCardinality: 100,
                        observationCardinalityNext: 100
                    };

                case 'observations':
                    return {
                        blockTimestamp: Math.floor(Date.now() / 1000),
                        lnImpliedRateCumulative: 1000000000000000000n,
                        initialized: true
                    };

                // Fee Distributor V2 functions
                case 'claimRetail':
                    return 1000000000000000000n; // Mock amountOut

                case 'claimProtocol':
                    return {
                        totalAmountOut: 1000000000000000000n,
                        amountsOut: [500000000000000000n, 500000000000000000n]
                    };

                case 'getProtocolClaimables':
                    return [500000000000000000n, 500000000000000000n];

                case 'getProtocolTotalAccrued':
                    return 1000000000000000000n;

                // Limit Order functions
                case 'fill':
                    return {
                        actualMaking: 1000000000000000000n,
                        actualTaking: 1000000000000000000n,
                        totalFee: 10000000000000000n,
                        callbackReturn: '0x'
                    };

                case 'cancelBatch':
                case 'cancelSingle':
                    return null;

                case 'orderStatuses':
                    return {
                        remainings: [1000000000000000000n, 500000000000000000n],
                        filledAmounts: [0n, 500000000000000000n]
                    };

                case 'DOMAIN_SEPARATOR':
                    return '0x1234567890123456789012345678901234567890123456789012345678901234';

                case 'simulate':
                    return {
                        success: true,
                        result: '0x'
                    };

                // Add/Remove Liquidity functions
                case 'addLiquidityDualTokenAndPt':
                    return {
                        netLpOut: 1000000000000000000n,
                        netPtUsed: 1000000000000000000n,
                        netSyInterm: 1000000000000000000n
                    };

                case 'addLiquidityDualSyAndPt':
                    return {
                        netLpOut: 1000000000000000000n,
                        netSyUsed: 1000000000000000000n,
                        netPtUsed: 1000000000000000000n
                    };

                case 'addLiquiditySinglePt':
                    return {
                        netLpOut: 1000000000000000000n,
                        netSyFee: 10000000000000000n
                    };

                case 'addLiquiditySingleToken':
                    return {
                        netLpOut: 1000000000000000000n,
                        netSyFee: 10000000000000000n,
                        netSyInterm: 1000000000000000000n
                    };

                case 'addLiquiditySingleSy':
                    return {
                        netLpOut: 1000000000000000000n,
                        netSyFee: 10000000000000000n
                    };

                // Remove Liquidity functions
                case 'removeLiquidityDualSyAndPt':
                    return {
                        netSyOut: 1000000000000000000n,
                        netPtOut: 1000000000000000000n
                    };

                case 'removeLiquiditySingleToken':
                    return {
                        netTokenOut: 1000000000000000000n,
                        netSyFee: 10000000000000000n,
                        netSyInterm: 1000000000000000000n
                    };

                case 'removeLiquiditySingleSy':
                    return {
                        netSyOut: 1000000000000000000n,
                        netSyFee: 10000000000000000n
                    };

                default:
                    throw new Error(`Unknown function: ${functionName}`);
            }
        } catch (error) {
            console.error('Mock provider error:', error);
            throw error;
        }
    },
    
    sendTransaction: async (params: any) => {
        return { hash: '0x123...', wait: async () => ({ status: 1 }) };
    }
} as const; 