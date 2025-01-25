import { formatUnits } from 'viem';
import { 
    FunctionReturn, 
    FunctionOptions, 
    toResult,
    ChainId
} from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants';
import GLPManagerABI from '../../abis/GLPManager.json';

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
        return toResult('Missing chain name');
    }
    if (!Object.values(NETWORKS).includes(chainName)) {
        return toResult(`Network ${chainName} not supported`);
    }

    await notify('Fetching pool liquidity information...');
    try {
        const publicClient = getProvider(chainName as ChainId);
        const [totalSupply, aum] = await Promise.all([
            publicClient.readContract({
                address: CONTRACT_ADDRESSES[chainName].GLP_TOKEN,
                abi: GLPManagerABI.abi,
                functionName: 'totalSupply',
                args: []
            }),
            publicClient.readContract({
                address: CONTRACT_ADDRESSES[chainName].GLP_MANAGER,
                abi: GLPManagerABI.abi,
                functionName: 'getAum',
                args: [true] // Include pending changes
            })
        ]);

        return toResult(`Total Supply: ${formatUnits(totalSupply as bigint, 18)} GLP, AUM: ${formatUnits(aum as bigint, 18)} USD`);
    } catch (error) {
        return toResult(`Failed to fetch pool liquidity: ${error.message}`);
    }
} 