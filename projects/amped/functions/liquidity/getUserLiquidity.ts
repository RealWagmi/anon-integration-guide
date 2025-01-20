import { formatUnits, Address } from 'viem';
import { 
    FunctionReturn, 
    FunctionOptions, 
    toResult,
    readContract
} from '@heyanon/sdk';
import { NETWORK_CONFIGS } from './types';
import GLPManagerABI from '../../abis/GLPManager.json';

/**
 * Interface for getting user's liquidity information
 * @property {string} chainName - The name of the chain
 * @property {Address} account - The account address to check
 */
export interface GetUserLiquidityProps {
    chainName: string;
    account: Address;
}

/**
 * Gets the amount of GLP tokens held by an account
 * @param {GetUserLiquidityProps} props - The properties for getting liquidity info
 * @param {FunctionOptions} options - The function options
 * @returns {Promise<FunctionReturn<{ glpBalance: string }>>} The user's GLP balance
 */
export async function getUserLiquidity({ 
    chainName, 
    account 
}: GetUserLiquidityProps, 
{ notify }: FunctionOptions): Promise<FunctionReturn> {
    // Input validation
    if (!chainName || !account) {
        return toResult('Missing required parameters', false);
    }
    const network = NETWORK_CONFIGS[chainName];
    if (!network) {
        return toResult(`Network ${chainName} not supported`, false);
    }
    
    await notify('Fetching user liquidity information...');
    try {
        const glpBalance = await readContract({
            address: network.glpToken,
            abi: GLPManagerABI,
            functionName: 'balanceOf',
            args: [account]
        });
        return toResult({
            glpBalance: formatUnits(glpBalance, 18)
        });
    } catch (error) {
        return toResult(`Failed to fetch user liquidity: ${error.message}`, false);
    }
} 