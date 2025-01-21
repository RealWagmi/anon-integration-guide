import { type Address } from 'viem';
import { ValidationError } from './errors';
import { validateAddress } from './validation';

// Mock provider for testing
export const provider = {
    request: async ({ method, params }: { method: string; params: any[] }) => {
        console.log('Provider request:', { method, params });
        return { success: true };
    },
    readContract: async ({ functionName, args }: { functionName: string; args: any[] }) => {
        console.log('Provider readContract:', { functionName, args });

        switch (functionName) {
            case 'isExpired':
                return false;
            case 'rewardData':
                return {
                    periodFinish: BigInt(Math.floor(Date.now() / 1000) + 3600),
                    rewardRate: BigInt(1000000000000000),
                    lastUpdateTime: BigInt(Math.floor(Date.now() / 1000)),
                    rewardPerTokenStored: BigInt(1000000000000000)
                };
            case 'isValidMarket':
                const marketAddress = args[0] as Address;
                validateAddress(marketAddress);
                return true;
            case 'addLiquidityDualSyAndPtStatic':
                return {
                    netLpOut: BigInt(args[1]),
                    netSyFee: BigInt(10000000000000),
                    netPtFee: BigInt(10000000000000)
                };
            case 'addLiquidityDualTokenAndPtStatic':
                return {
                    netLpOut: BigInt(args[2]),
                    netTokenFee: BigInt(10000000000000),
                    netPtFee: BigInt(10000000000000)
                };
            case 'addLiquiditySinglePtStatic':
                return {
                    netLpOut: BigInt(args[1]),
                    netPtFee: BigInt(10000000000000)
                };
            case 'addLiquiditySingleSyKeepYtStatic':
                return {
                    netLpOut: BigInt(args[1]),
                    netSyFee: BigInt(10000000000000)
                };
            case 'addLiquiditySingleSy':
                return {
                    netLpOut: BigInt('1000000000000000000'),
                    netSyFee: BigInt('10000000000000')
                };
            // Market Oracle handlers
            case 'observe':
                return args[0].map(() => BigInt('1000000000000000000')); // Return 1.0 for each requested observation
            case '_storage':
                return {
                    lastLnImpliedRate: BigInt('1000000000000000000'),
                    observationIndex: 0,
                    observationCardinality: 100,
                    observationCardinalityNext: 100
                };
            case 'observations':
                return {
                    blockTimestamp: BigInt(Math.floor(Date.now() / 1000)),
                    lnImpliedRateCumulative: BigInt('1000000000000000000'),
                    initialized: true
                };
            // Standardized Yield handlers
            case 'exchangeRate':
                return BigInt('1000000000000000000'); // 1.0 exchange rate
            case 'accruedRewards':
                return [BigInt('1000000000000000000')]; // 1.0 rewards accrued
            case 'getRewardTokens':
                return [
                    '0x1234567890123456789012345678901234567890',
                    '0x2345678901234567890123456789012345678901'
                ];
            case 'yieldToken':
                return '0x3456789012345678901234567890123456789012';
            case 'getTokensIn':
                return [
                    '0x4567890123456789012345678901234567890123',
                    '0x5678901234567890123456789012345678901234'
                ];
            case 'getTokensOut':
                return [
                    '0x6789012345678901234567890123456789012345',
                    '0x7890123456789012345678901234567890123456'
                ];
            case 'isValidTokenIn':
                return true;
            case 'isValidTokenOut':
                return true;
            case 'previewDeposit':
                return BigInt('1000000000000000000'); // 1:1 deposit ratio
            case 'previewRedeem':
                return BigInt('1000000000000000000'); // 1:1 redeem ratio
            case 'calcPriceImpactPY':
            case 'calcPriceImpactPt':
            case 'calcPriceImpactYt':
                return BigInt('1000000000000000000'); // 1e18 representing 1.0 impact
            
            case 'getMarketState':
                return {
                    pt: '0x1234567890123456789012345678901234567890' as Address,
                    yt: '0x0987654321098765432109876543210987654321' as Address,
                    sy: '0xabcdef0123456789abcdef0123456789abcdef01' as Address,
                    impliedYield: BigInt('1000000000000000000'), // 1.0
                    marketExchangeRateExcludeFee: BigInt('1000000000000000000'),
                    state: {
                        totalPt: BigInt('1000000000000000000'),
                        totalSy: BigInt('1000000000000000000'),
                        totalLp: BigInt('1000000000000000000'),
                        treasury: BigInt('1000000000000000000'),
                        scalarRoot: BigInt('1000000000000000000'),
                        expiry: BigInt(1735689600) // Example timestamp
                    }
                };
            
            case 'getYieldTokenAndPtRate':
            case 'getYieldTokenAndYtRate':
                return {
                    yieldToken: '0xabcdef0123456789abcdef0123456789abcdef01' as Address,
                    netPtOut: BigInt('1000000000000000000'),
                    netYieldTokenOut: BigInt('1000000000000000000')
                };
            
            case 'getLpToSyRate':
                return BigInt('1000000000000000000');
            
            case 'redeemRewards':
                return {
                    success: true,
                    data: 'Successfully redeemed rewards'
                };
            
            case 'claimRewards':
                return {
                    success: true,
                    data: 'Successfully claimed rewards'
                };
            
            default:
                throw new Error(`Unhandled function call: ${functionName}`);
        }
    },
    prepareTransaction: async (params: any) => {
        return {
            to: params.to || '0x0000000000000000000000000000000000000000',
            data: '0x',
            value: '0x0'
        };
    }
};

export const getProvider = () => provider;

export const sendTransactions = async (params: any) => {
    console.log('Transaction params:', params);
    return { success: true, data: 'Successfully redeemed rewards' };
};

export const notify = async (message: string) => {
    console.log('Notification:', message);
}; 