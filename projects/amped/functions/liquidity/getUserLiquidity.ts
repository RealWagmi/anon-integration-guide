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
 * Interface for getting user's liquidity information
 * @property {string} chainName - The name of the chain
 * @property {string} account - The account address to check
 */
export interface UserLiquidityProps {
    chainName: 'sonic';
    account: string;
}

/**
 * Gets the GLP balance for a specified account and chain
 * @param {string} chainName - The name of the chain
 * @param {string} account - The account address
 * @param {FunctionOptions} options - The function options
 * @returns {Promise<FunctionReturn<{ balance: string }>>} The user's GLP balance
 */
export async function getUserLiquidity(
    { chainName, account }: UserLiquidityProps,
    { notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Input validation
    if (!chainName) {
        return toResult('Missing chain name');
    }
    if (!Object.values(NETWORKS).includes(chainName)) {
        return toResult(`Network ${chainName} not supported`);
    }
    if (!account) {
        return toResult('Missing account address');
    }

    await notify('Fetching user liquidity information...');
    try {
        const publicClient = getProvider(chainName as ChainId);
        const balance = await publicClient.readContract({
            address: CONTRACT_ADDRESSES[chainName].GLP_TOKEN,
            abi: GLPManagerABI.abi,
            functionName: 'balanceOf',
            args: [account]
        });

        return toResult(`GLP Balance: ${formatUnits(balance as bigint, 18)} GLP`);
    } catch (error) {
        return toResult(`Failed to fetch user liquidity: ${error.message}`);
    }
} 