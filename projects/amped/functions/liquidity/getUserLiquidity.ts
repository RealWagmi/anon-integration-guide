import { formatUnits, Address, getContract } from 'viem';
import { 
    FunctionReturn, 
    FunctionOptions, 
    toResult
} from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { GlpManager } from '../../abis/GlpManager.js';
import { ERC20 } from '../../abis/ERC20.js';
import { Vester } from '../../abis/Vester.js';

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
 * Interface for the user's ALP position details
 */
export interface UserLiquidityInfo {
    /** Total fsALP balance */
    balance: string;
    /** Total USD value of fsALP */
    usdValue: string;
    /** Current ALP price */
    alpPrice: string;
    /** Amount of ALP reserved in vesting */
    reservedAmount: string;
    /** USD value of reserved ALP */
    reservedUsdValue: string;
    /** Amount of ALP available to sell (total - reserved) */
    availableAmount: string;
    /** USD value of available ALP */
    availableUsdValue: string;
    /** Claimable rewards (to be implemented) */
    claimableRewards: string;
}

/**
 * Gets the user's ALP (Amped Liquidity Provider) information including:
 * - Total fsALP balance and USD value
 * - Reserved amount in vesting and its USD value
 * - Available amount for selling and its USD value
 * - Current ALP price
 * 
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
        console.log('CONTRACT_ADDRESSES:', CONTRACT_ADDRESSES);
        console.log('NETWORKS.SONIC:', NETWORKS.SONIC);
        console.log('CONTRACT_ADDRESSES[NETWORKS.SONIC]:', CONTRACT_ADDRESSES[NETWORKS.SONIC]);
        
        const provider = getProvider(146); // Sonic chain ID

        // Initialize contracts
        const glpManager = getContract({
            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER as Address,
            abi: GlpManager,
            client: provider
        });

        const fsAlpToken = getContract({
            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].FS_ALP as Address,
            abi: ERC20,
            client: provider
        });

        if (!CONTRACT_ADDRESSES[NETWORKS.SONIC].ALP_VESTER) {
            console.error('ALP_VESTER address is missing from CONTRACT_ADDRESSES[NETWORKS.SONIC]:', CONTRACT_ADDRESSES[NETWORKS.SONIC]);
            throw new Error('ALP_VESTER address is not defined');
        }

        const alpVester = getContract({
            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].ALP_VESTER as Address,
            abi: Vester,
            client: provider
        });

        console.log('Contracts initialized with addresses:', {
            glpManager: CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER,
            fsAlp: CONTRACT_ADDRESSES[NETWORKS.SONIC].FS_ALP,
            alpVester: CONTRACT_ADDRESSES[NETWORKS.SONIC].ALP_VESTER
        });

        // Get fsALP balance
        const balance = await fsAlpToken.read.balanceOf([account]) as bigint;
        console.log('fsALP balance:', balance.toString());
        
        // Get ALP price
        const alpPrice = await glpManager.read.getPrice([false]) as bigint;
        console.log('ALP price:', alpPrice.toString());
        
        // Get reserved amount in vesting
        console.log('Calling pairAmounts with account:', account);
        const reservedAmount = await alpVester.read.pairAmounts([account]) as bigint;
        console.log('Reserved amount:', reservedAmount.toString());

        // Calculate available amount (total balance - reserved)
        const availableAmount = balance - reservedAmount;
        
        // Calculate USD values (ALP price is in 1e30)
        const usdValue = (balance * alpPrice) / (10n ** 30n);
        const availableUsdValue = (availableAmount * alpPrice) / (10n ** 30n);
        const reservedUsdValue = (reservedAmount * alpPrice) / (10n ** 30n);

        const result: UserLiquidityInfo = {
            balance: formatUnits(balance, 18),
            usdValue: formatUnits(usdValue, 18),
            alpPrice: formatUnits(alpPrice, 30),
            reservedAmount: formatUnits(reservedAmount, 18),
            reservedUsdValue: formatUnits(reservedUsdValue, 18),
            availableAmount: formatUnits(availableAmount, 18),
            availableUsdValue: formatUnits(availableUsdValue, 18),
            claimableRewards: "0" // Temporarily set to 0 until we implement proper rewards tracking
        };

        return toResult(JSON.stringify(result));
    } catch (error) {
        console.error('Error in getUserLiquidity:', error);
        if (error instanceof Error) {
            return toResult(`Failed to fetch user liquidity: ${error.message}`, true);
        }
        return toResult('Failed to fetch user liquidity: Unknown error', true);
    }
} 