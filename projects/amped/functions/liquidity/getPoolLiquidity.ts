import { formatUnits } from 'viem';
import { 
    FunctionReturn, 
    FunctionOptions, 
    toResult,
    readContract
} from '@heyanon/sdk';
import { NETWORK_CONFIGS } from './types';
import GLPManagerABI from '../../abis/GLPManager.json';

/**
 * Gets the total GLP supply and Assets Under Management (AUM)
 * @param {string} chainName - The name of the chain
 * @param {FunctionOptions} options - The function options
 * @returns {Promise<FunctionReturn<{ totalSupply: string, aum: string }>>} The pool information
 */
export async function getPoolLiquidity(
    chainName: string,
    { notify }: FunctionOptions
): Promise<FunctionReturn> {
    // Input validation
    if (!chainName) {
        return toResult('Missing chain name', false);
    }
    const network = NETWORK_CONFIGS[chainName];
    if (!network) {
        return toResult(`Network ${chainName} not supported`, false);
    }

    await notify('Fetching pool liquidity information...');
    try {
        const [totalSupply, aum] = await Promise.all([
            readContract({
                address: network.glpToken,
                abi: GLPManagerABI,
                functionName: 'totalSupply',
                args: []
            }),
            readContract({
                address: network.glpManager,
                abi: GLPManagerABI,
                functionName: 'getAum',
                args: [true] // Include pending changes
            })
        ]);

        return toResult({
            totalSupply: formatUnits(totalSupply, 18),
            aum: formatUnits(aum, 18)
        });
    } catch (error) {
        return toResult(`Failed to fetch pool liquidity: ${error.message}`, false);
    }
} 