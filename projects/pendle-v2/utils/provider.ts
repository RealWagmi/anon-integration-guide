// Mock provider for testing
export const provider = {
    request: async () => null,
    readContract: async (params: any) => {
        try {
            // Validate market address
            if (params.address === '0x0000000000000000000000000000000000000000') {
                throw new Error('Invalid market address: zero address');
            }

            // Validate market is supported
            const isKnownMarket = params.address === '0x27b1dAcd74688aF24a64BD3C9C1B143118740784' || 
                                 params.address === '0x2FCb47B58350cD377f94d3821e7373Df60bD9Ced';
            if (!isKnownMarket) {
                throw new Error(`Invalid market address: ${params.address}`);
            }

            // Return mock data based on function
            if (params.functionName === 'isExpired') return false;
            if (params.functionName === 'rewardData') {
                return {
                    pendlePerSec: 1000n,
                    accumulatedPendle: 5000n,
                    lastUpdated: BigInt(Date.now()),
                    incentiveEndsAt: BigInt(Date.now() + 86400000)
                };
            }
            if (params.functionName === 'isValidMarket') {
                return true;
            }
            throw new Error(`Unknown function: ${params.functionName}`);
        } catch (error) {
            console.error('Mock provider error:', error);
            throw error;
        }
    }
} as const; 