import { parseUnits, encodeFunctionData, formatUnits, Abi, Address, getContract } from 'viem';
import { 
    FunctionReturn, 
    FunctionOptions, 
    toResult,
    ChainId,
    checkToApprove,
    TransactionParams
} from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS, CHAIN_IDS } from '../../constants.js';
import { GlpManager } from '../../abis/GlpManager.js';
import { ERC20 } from '../../abis/ERC20.js';
import { getUserLiquidity } from './getUserLiquidity.js';
import { getPoolLiquidity } from './getPoolLiquidity.js';

export interface RemoveLiquidityProps {
    chainName: 'sonic';
    account: string;
    tokenOut: string;
    amount: string;
    slippageTolerance?: number;
    skipSafetyChecks?: boolean;
}

// Define the specific ABI for the removeLiquidity function to ensure type safety
const REMOVE_LIQUIDITY_ABI = [{
    inputs: [
        { name: 'tokenOut', type: 'address' },
        { name: 'glpAmount', type: 'uint256' },
        { name: 'minOut', type: 'uint256' },
        { name: 'receiver', type: 'address' }
    ],
    name: 'removeLiquidity',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
}] as const;

// Define the specific ABI for unstaking and redeeming into native token
const UNSTAKE_AND_REDEEM_GLP_ETH_ABI = [{
    inputs: [
        { name: 'glpAmount', type: 'uint256' },
        { name: 'minOut', type: 'uint256' },
        { name: 'receiver', type: 'address' }
    ],
    name: 'unstakeAndRedeemGlpETH',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
}] as const;

// Define the specific ABI for unstaking and redeeming into ERC20 token
const UNSTAKE_AND_REDEEM_GLP_ABI = [{
    inputs: [
        { name: 'tokenOut', type: 'address' },
        { name: 'glpAmount', type: 'uint256' },
        { name: 'minOut', type: 'uint256' },
        { name: 'receiver', type: 'address' }
    ],
    name: 'unstakeAndRedeemGlp',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
}] as const;

// Define the specific ABI for approving fsALP
const FS_ALP_ABI = [{
    inputs: [
        { name: 'spender', type: 'address' },
        { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
}] as const;

/**
 * Removes liquidity from the ALP pool with optional safety checks:
 * 1. Verifies user has enough available ALP (not locked in vesting)
 * 2. Verifies pool has enough liquidity of desired output token
 * 3. Executes the removal transaction if all checks pass
 * 
 * Supports both native token (S) and ERC20 token redemptions.
 * Automatically calculates minimum output amount based on current price and slippage tolerance.
 * 
 * @param {RemoveLiquidityProps} props - The properties for removing liquidity
 * @param {FunctionOptions} options - The function options
 * @returns {Promise<FunctionReturn>} The transaction result
 */
export async function removeLiquidity(
    { chainName, account, tokenOut, amount, slippageTolerance = 0.5, skipSafetyChecks = false }: RemoveLiquidityProps,
    options: FunctionOptions
): Promise<FunctionReturn> {
    const { notify, getProvider, sendTransactions } = options;

    // Input validation
    if (!chainName || !account || !tokenOut || !amount) {
        return toResult('Missing required parameters', true);
    }
    if (!Object.values(NETWORKS).includes(chainName)) {
        return toResult(`Network ${chainName} not supported`, true);
    }

    try {
        const publicClient = getProvider(chainName as unknown as ChainId);
        const amountInWei = parseUnits(amount, 18);
        
        // Get token-specific details first
        const isNativeToken = tokenOut.toLowerCase() === CONTRACT_ADDRESSES[chainName].NATIVE_TOKEN.toLowerCase();
        const outputToken = getContract({
            address: isNativeToken ? CONTRACT_ADDRESSES[chainName].WETH as Address : tokenOut as Address,
            abi: ERC20,
            client: publicClient
        });

        // Get token decimals
        const decimals = await outputToken.read.decimals();
        let minOutInTokenWei: bigint;

        if (!skipSafetyChecks) {
            await notify('Performing safety checks...');

            // First check user's available ALP balance
            const userLiquidityResult = await getUserLiquidity({ 
                chainName, 
                account: account as Address 
            }, options);

            if (userLiquidityResult.data.startsWith('Failed')) {
                return userLiquidityResult;
            }

            const userLiquidity = JSON.parse(userLiquidityResult.data);
            const availableAmount = parseUnits(userLiquidity.availableAmount, 18);

            if (amountInWei > availableAmount) {
                return toResult(
                    `Insufficient available ALP. Requested: ${amount}, Available: ${userLiquidity.availableAmount}`,
                    true
                );
            }

            // Then check pool liquidity and calculate minOut based on current price
            const poolLiquidityResult = await getPoolLiquidity(chainName, options);
            if (poolLiquidityResult.data.startsWith('Failed')) {
                return poolLiquidityResult;
            }

            const poolData = JSON.parse(poolLiquidityResult.data);
            const glpPrice = Number(poolData.aum) / Number(poolData.totalSupply);
            const amountUsd = Number(amount) * glpPrice;

            // Get token price and calculate minOut with slippage tolerance
            const tokenPrice = await outputToken.read.balanceOf([CONTRACT_ADDRESSES[chainName].VAULT as Address]) as bigint;
            const minOutAmount = (amountUsd / Number(tokenPrice)) * (1 - slippageTolerance / 100);
            minOutInTokenWei = parseUnits(minOutAmount.toFixed(decimals), decimals);

            // Check if pool has enough liquidity
            const tokenBalance = await outputToken.read.balanceOf([
                CONTRACT_ADDRESSES[chainName].VAULT as Address
            ]) as bigint;

            if (tokenBalance < minOutInTokenWei) {
                return toResult(
                    `Insufficient pool liquidity for ${isNativeToken ? 'S' : await outputToken.read.symbol()}. ` +
                    `Required: ${formatUnits(minOutInTokenWei, decimals)}, Available: ${formatUnits(tokenBalance, decimals)}`,
                    true
                );
            }
        } else {
            // If skipping safety checks, use a default minOut based on amount and slippage
            const minOutAmount = Number(amount) * (1 - slippageTolerance / 100);
            minOutInTokenWei = parseUnits(minOutAmount.toFixed(decimals), decimals);
        }

        await notify('Preparing to remove liquidity...');
        const transactions: TransactionParams[] = [];

        // Prepare transaction based on output token type
        const tx: TransactionParams = {
            target: CONTRACT_ADDRESSES[chainName].REWARD_ROUTER as Address,
            data: isNativeToken
                ? encodeFunctionData({
                    abi: UNSTAKE_AND_REDEEM_GLP_ETH_ABI,
                    functionName: 'unstakeAndRedeemGlpETH',
                    args: [amountInWei, minOutInTokenWei, account as Address]
                })
                : encodeFunctionData({
                    abi: UNSTAKE_AND_REDEEM_GLP_ABI,
                    functionName: 'unstakeAndRedeemGlp',
                    args: [tokenOut as Address, amountInWei, minOutInTokenWei, account as Address]
                })
        };
        transactions.push(tx);

        // Send transaction
        await sendTransactions({ 
            chainId: CHAIN_IDS[chainName],
            account: account as Address,
            transactions
        });
        return toResult('Successfully removed liquidity');
    } catch (error) {
        console.error('Error in removeLiquidity:', error);
        if (error instanceof Error) {
            return toResult(`Failed to remove liquidity: ${error.message}`, true);
        }
        return toResult('Failed to remove liquidity: Unknown error', true);
    }
} 