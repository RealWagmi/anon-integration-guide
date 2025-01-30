import { Address, getContract, encodeFunctionData, parseUnits, PublicClient, WalletClient, Client } from 'viem';
import { FunctionReturn, FunctionOptions, toResult, TransactionParams } from '@heyanon/sdk';
import { CONTRACT_ADDRESSES, NETWORKS, CHAIN_IDS } from '../../constants.js';
import { ERC20 } from '../../abis/ERC20.js';
import { RewardRouter } from '../../abis/RewardRouter.js';
import { Vault } from '../../abis/Vault.js';
import { GlpManager } from '../../abis/GlpManager.js';
import { getAcceptedTokenBalances } from './getAcceptedTokenBalances.js';

interface AddLiquidityParams {
  chainName: string;
  tokenIn: Address;
  amount: string;
  minOut?: string;
}

/**
 * Add liquidity to the protocol by providing tokens in exchange for GLP
 * @param props - The liquidity addition parameters
 * @param props.chainName - The name of the chain (e.g., "sonic")
 * @param props.tokenIn - Address of the token to provide as liquidity
 * @param props.amount - Amount of tokens to provide as liquidity
 * @param props.minOut - Minimum amount of GLP tokens to receive (optional)
 * @param options - SDK function options
 * @param options.getProvider - Function to get the provider for a chain
 * @param options.notify - Function to send notifications
 * @param options.sendTransactions - Function to send transactions
 * @returns Transaction details and status
 */
export async function addLiquidity(
  { chainName, tokenIn, amount, minOut }: AddLiquidityParams,
  { getProvider, notify, sendTransactions }: FunctionOptions
): Promise<FunctionReturn> {
  try {
    // Validate chain
    if (chainName.toLowerCase() !== "sonic") {
      return toResult("This function is only supported on Sonic chain", true);
    }

    await notify("Checking available token balances...");

    // Create public client for reading
    const provider = getProvider(CHAIN_IDS[NETWORKS.SONIC]);
    const publicClient = provider as unknown as PublicClient;
    const walletClient = provider as unknown as WalletClient;

    if (!walletClient.account) {
      return toResult("No account connected", true);
    }

    // Get all token balances first
    const balancesResult = await getAcceptedTokenBalances(chainName, { 
      getProvider,
      notify,
      sendTransactions
    });

    if (!balancesResult.success) {
      return balancesResult;
    }

    const balances = JSON.parse(balancesResult.data);
    const tokenInfo = balances.tokens.find((t: any) => t.address.toLowerCase() === tokenIn.toLowerCase());
    
    if (!tokenInfo) {
      return toResult(`Token ${tokenIn} is not an accepted liquidity token`, true);
    }

    // Check if user has enough balance
    const parsedAmount = parseUnits(amount, tokenInfo.decimals);
    if (parsedAmount > BigInt(tokenInfo.balance)) {
      return toResult(`Insufficient ${tokenInfo.symbol} balance. Available: ${tokenInfo.balance}`, true);
    }

    await notify("Initializing liquidity addition...");

    const isNative = tokenIn.toLowerCase() === CONTRACT_ADDRESSES[NETWORKS.SONIC].NATIVE_TOKEN.toLowerCase();

    // Initialize contracts
    const vault = getContract({
      address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
      abi: Vault,
      client: publicClient
    });

    const tokenContract = isNative ? null : getContract({
      address: tokenIn,
      abi: ERC20,
      client: publicClient
    });

    const rewardRouter = getContract({
      address: CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_ROUTER,
      abi: RewardRouter,
      client: publicClient
    });

    // Calculate USD value and minimum outputs
    const tokenPrice = BigInt(tokenInfo.price);
    const usdValue = (parsedAmount * tokenPrice) / (10n ** 30n); // Price is in 1e30
    
    // Use provided minOut or default to 1% slippage
    const slippageBps = 100; // 1%
    const minUsdg = minOut ? parseUnits(minOut, tokenInfo.decimals) : (usdValue * BigInt(10000 - slippageBps)) / 10000n;

    // Get GLP price and calculate min GLP
    const glpManager = getContract({
      address: CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER,
      abi: GlpManager,
      client: publicClient
    });

    const glpPrice = await glpManager.read.getPrice([false]) as bigint; // false for min price
    const minGlp = minOut ? parseUnits(minOut, tokenInfo.decimals) : (minUsdg * (10n ** 30n)) / glpPrice;

    // Prepare transactions
    const transactions: TransactionParams[] = [];

    // Add approval transaction if needed
    if (!isNative) {
      await notify("Checking token approval...");

      const allowance = await tokenContract!.read.allowance([
        walletClient.account.address,
        CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER
      ]);

      if (allowance < parsedAmount) {
        await notify("Approval needed. Sending approval transaction...");
        const approveData = encodeFunctionData({
          abi: ERC20,
          functionName: 'approve',
          args: [CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER, parsedAmount]
        });

        transactions.push({
          target: tokenIn,
          data: approveData,
          value: BigInt(0)
        });
      }
    }

    await notify("Preparing liquidity addition transaction...");

    const mintData = encodeFunctionData({
      abi: RewardRouter,
      functionName: isNative ? 'mintAndStakeGlpETH' : 'mintAndStakeGlp',
      args: isNative ? [minUsdg, minGlp] : [tokenIn, parsedAmount, minUsdg, minGlp]
    });

    transactions.push({
      target: CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_ROUTER,
      data: mintData,
      value: isNative ? parsedAmount : BigInt(0)
    });

    // Send transactions
    const result = await sendTransactions({
      chainId: CHAIN_IDS[NETWORKS.SONIC],
      account: walletClient.account.address,
      transactions
    });

    return toResult(result.data?.[0]?.hash || "Transaction sent", !result.data?.[0]?.hash);

  } catch (error) {
    console.error('Error in addLiquidity:', error);
    
    if (error instanceof Error) {
      return toResult(`Failed to add liquidity: ${error.message}`, true);
    }
    return toResult("Failed to add liquidity. Please try again.", true);
  }
}