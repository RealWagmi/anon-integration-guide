import { formatUnits, Address, getContract } from 'viem';
import { 
    FunctionReturn, 
    FunctionOptions, 
    toResult
} from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS, CHAIN_CONFIG } from '../../constants.js';
import { GlpManager } from '../../abis/GlpManager.js';
import { ERC20 } from '../../abis/ERC20.js';

/**
 * Interface for getting user's liquidity information
 * @property {string} chainName - The name of the chain
 * @property {string} account - The account address to check
 */
export interface UserLiquidityProps {
    chainName: 'sonic';
    account: Address;
}

/**
 * Gets the user's ALP (Amped Liquidity Provider) information including:
 * - ALP balance
 * - USD value of ALP
 * @param {UserLiquidityProps} props - The input parameters
 * @param {FunctionOptions} options - The function options
 * @returns {Promise<FunctionReturn>} The user's ALP information
 */
export async function getUserLiquidity(
    { chainName, account }: UserLiquidityProps,
    { notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate chain
    if (chainName.toLowerCase() !== "sonic") {
        return toResult("This function is only supported on Sonic chain", true);
    }

    if (!account) {
        return toResult('Missing account address', true);
    }

    // Check for zero address
    if (account === '0x0000000000000000000000000000000000000000') {
        return toResult('Failed to fetch user liquidity: zero address not allowed', true);
    }

    await notify('Fetching user liquidity information...');
    
    try {
        const provider = getProvider(146); // Sonic chain ID

        // Initialize contracts
        const glpManager = getContract({
            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER,
            abi: GlpManager,
            client: provider
        });

        const fsAlpToken = getContract({
            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].FS_ALP,
            abi: ERC20,
            client: provider
        });

        // Get fsALP balance
        const balance = await fsAlpToken.read.balanceOf(
            [account],
            { gas: 100000n }
        ) as bigint;
        
        // Get ALP price
        const alpPrice = await glpManager.read.getPrice(
            [false],
            { gas: 100000n }
        ) as bigint;
        
        // Calculate USD value (ALP price is in 1e30)
        const usdValue = (balance * alpPrice) / (10n ** 30n);

        return toResult(JSON.stringify({
            balance: formatUnits(balance, 18),
            usdValue: formatUnits(usdValue, 18),
            alpPrice: formatUnits(alpPrice, 30),
            claimableRewards: "0" // Temporarily set to 0 until we implement proper rewards tracking
        }));
    } catch (error) {
        console.error('Error in getUserLiquidity:', error);
        if (error instanceof Error) {
            return toResult(`Failed to fetch user liquidity: ${error.message}`, true);
        }
        return toResult('Failed to fetch user liquidity: Unknown error', true);
    }
} 