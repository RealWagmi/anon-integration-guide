import { formatUnits } from 'viem';
import { 
    FunctionReturn, 
    FunctionOptions, 
    toResult,
    ChainId
} from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { GlpManager } from '../../abis/GlpManager.js';
import { ERC20 } from '../../abis/ERC20.js';

// Define the specific ABI for the functions we need
const GLP_TOKEN_ABI = [{
    inputs: [],
    name: 'totalSupply',
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
    type: 'function'
}] as const;

const GLP_MANAGER_ABI = [{
    inputs: [{ type: 'bool', name: 'maximise' }],
    name: 'getAum',
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view',
    type: 'function'
}] as const;

/**
 * Gets the total GLP supply and Assets Under Management (AUM)
 * @param {string} chainName - The name of the chain
 * @param {FunctionOptions} options - The function options
 * @returns {Promise<FunctionReturn<{ totalSupply: string, aum: string }>>} The pool information
 */
export async function getPoolLiquidity(
    chainName: 'sonic',
    { notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Input validation
    if (!chainName) {
        return toResult('Missing chain name', true);
    }
    if (!Object.values(NETWORKS).includes(chainName)) {
        return toResult(`Network ${chainName} not supported`, true);
    }

    await notify('Fetching pool liquidity information...');
    try {
        const publicClient = getProvider(chainName as unknown as ChainId);
        const [totalSupply, aum] = await Promise.all([
            publicClient.readContract({
                address: CONTRACT_ADDRESSES[chainName].GLP_TOKEN,
                abi: GLP_TOKEN_ABI,
                functionName: 'totalSupply'
            }),
            publicClient.readContract({
                address: CONTRACT_ADDRESSES[chainName].GLP_MANAGER,
                abi: GLP_MANAGER_ABI,
                functionName: 'getAum',
                args: [true] // Include pending changes
            })
        ]);

        return toResult(JSON.stringify({
            totalSupply: formatUnits(totalSupply as bigint, 18),
            aum: formatUnits(aum as bigint, 30)
        }));
    } catch (error) {
        console.error('Error in getPoolLiquidity:', error);
        if (error instanceof Error) {
            return toResult(`Failed to fetch pool liquidity: ${error.message}`, true);
        }
        return toResult('Failed to fetch pool liquidity: Unknown error', true);
    }
} 