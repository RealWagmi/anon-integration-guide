import { formatUnits, Address, getContract, PublicClient, Chain, Transport } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, getChainFromName } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { GlpManager } from '../../abis/GlpManager.js';
import { ERC20 } from '../../abis/ERC20.js';
import { Vester } from '../../abis/Vester.js';

/**
 * Interface for getting user's liquidity information
 * @property {string} chainName - The name of the chain (must be "sonic")
 * @property {string} account - The account address to check
 */
export interface UserLiquidityProps {
    chainName: (typeof NETWORKS)[keyof typeof NETWORKS];
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
 * Gets the user's ALP (Amped Liquidity Provider) information
 * @param {UserLiquidityProps} props - The input parameters
 * @param {FunctionOptions} options - The function options
 * @returns {Promise<FunctionReturn>} The user's ALP information including balances and values
 */
export async function getUserLiquidity({ chainName, account }: UserLiquidityProps, { notify, getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) {
        return toResult(`Network ${chainName} not supported`, true);
    }
    if (chainName !== NETWORKS.SONIC) {
        return toResult('This function is only supported on Sonic chain', true);
    }

    // Validate account
    if (!account) {
        return toResult('Account address is required', true);
    }

    if (account === '0x0000000000000000000000000000000000000000') {
        return toResult('Zero address not allowed', true);
    }

    try {
        await notify('Initializing contracts...');
        const provider = getProvider(chainId) as unknown as PublicClient<Transport, Chain>;

        // Initialize contracts
        const glpManager = getContract({
            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER as Address,
            abi: GlpManager,
            publicClient: provider,
        });

        const fsAlpToken = getContract({
            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].FS_ALP as Address,
            abi: ERC20,
            publicClient: provider,
        });

        if (!CONTRACT_ADDRESSES[NETWORKS.SONIC].ALP_VESTER) {
            return toResult('ALP_VESTER address is not configured', true);
        }

        const alpVester = getContract({
            address: CONTRACT_ADDRESSES[NETWORKS.SONIC].ALP_VESTER as Address,
            abi: Vester,
            publicClient: provider,
        });

        await notify('Fetching user balances and positions...');

        // Get fsALP balance
        const balance = await fsAlpToken.read.balanceOf([account]);

        // Get ALP price
        const alpPrice = await glpManager.read.getPrice([false]);

        // Get reserved amount in vesting
        const reservedAmount = await alpVester.read.pairAmounts([account]);

        // Calculate available amount (total balance - reserved)
        const availableAmount = balance - reservedAmount;

        // Calculate USD values (ALP price is in 1e30)
        const usdValue = (balance * alpPrice) / 10n ** 30n;
        const availableUsdValue = (availableAmount * alpPrice) / 10n ** 30n;
        const reservedUsdValue = (reservedAmount * alpPrice) / 10n ** 30n;

        await notify('Preparing response...');

        const result: UserLiquidityInfo = {
            balance: formatUnits(balance, 18),
            usdValue: formatUnits(usdValue, 18),
            alpPrice: formatUnits(alpPrice, 30),
            reservedAmount: formatUnits(reservedAmount, 18),
            reservedUsdValue: formatUnits(reservedUsdValue, 18),
            availableAmount: formatUnits(availableAmount, 18),
            availableUsdValue: formatUnits(availableUsdValue, 18),
            claimableRewards: '0', // To be implemented
        };

        return toResult(JSON.stringify(result));
    } catch (error) {
        if (error instanceof Error) {
            return toResult(`Failed to fetch user liquidity: ${error.message}`, true);
        }
        return toResult('Failed to fetch user liquidity: Unknown error', true);
    }
}
