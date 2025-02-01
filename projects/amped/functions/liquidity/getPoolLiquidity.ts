import { formatUnits } from 'viem';
import { 
    FunctionReturn, 
    FunctionOptions, 
    toResult,
    getChainFromName
} from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';

interface Props {
    chainName: string;
}

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
 * @param props - The function parameters
 * @param props.chainName - The name of the chain (must be "sonic")
 * @param options - System tools for blockchain interactions
 * @returns Pool information including total supply and AUM
 */
export async function getPoolLiquidity(
    { chainName }: Props,
    { notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (chainName !== NETWORKS.SONIC) {
        return toResult(`Protocol is only supported on Sonic chain`, true);
    }

    try {
        await notify('Fetching pool liquidity information...');
        
        const publicClient = getProvider(chainId);
        const [totalSupply, aum] = await Promise.all([
            publicClient.readContract({
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_TOKEN,
                abi: GLP_TOKEN_ABI,
                functionName: 'totalSupply'
            }),
            publicClient.readContract({
                address: CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER,
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
        if (error instanceof Error) {
            return toResult(`Failed to fetch pool liquidity: ${error.message}`, true);
        }
        return toResult('Failed to fetch pool liquidity: Unknown error', true);
    }
} 