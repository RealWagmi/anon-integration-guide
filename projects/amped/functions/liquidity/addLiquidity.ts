import { parseUnits, encodeFunctionData, Abi, formatUnits } from 'viem';
import { AddLiquidityProps } from './types';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants';
import GLPManagerABI from '../../abis/GLPManager.json';
import { TransactionReturnData } from '@heyanon/sdk';

/**
 * Calculate the current GLP price and minimum GLP to receive
 * @param publicClient - The public client to interact with the chain
 * @param chainName - The name of the chain
 * @param inputAmount - The USD value of tokens being provided
 * @param slippageBps - Slippage tolerance in basis points (e.g. 100 = 1%)
 * @returns The minimum GLP amount to receive
 */
async function calculateMinGlp(
  publicClient: any,
  chainName: string,
  inputAmount: bigint,
  slippageBps: number = 100 // Default 1% slippage
): Promise<bigint> {
  // Get total supply and AUM
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

  // Calculate GLP price: AUM / total supply
  const glpPrice = (aum as bigint) * BigInt(1e18) / (totalSupply as bigint);
  
  // Calculate expected GLP: input amount * 1e18 / GLP price
  const expectedGlp = (inputAmount * BigInt(1e18)) / glpPrice;
  
  // Apply slippage tolerance
  const minGlp = (expectedGlp * BigInt(10000 - slippageBps)) / BigInt(10000);
  
  return minGlp;
}

/**
 * Adds liquidity to the GLP pool
 * @param {AddLiquidityProps} props - The properties for adding liquidity
 * @param {string} props.chainName - The name of the chain
 * @param {string} props.account - The account address
 * @param {string} props.tokenIn - The token address to provide
 * @param {string} props.amount - The amount of tokens to provide
 * @param {string} props.minOut - The minimum amount of GLP to receive (optional, will be calculated if not provided)
 * @param {FunctionOptions} options - The function options
 * @returns {Promise<FunctionReturn>} The transaction result
 */
export async function addLiquidity(
  params: AddLiquidityProps,
  callbacks: {
    sendTransactions: (params: { transactions: { target: string; data: string }[] }) => Promise<{ success: boolean; message: string; data: TransactionReturnData[]; isMultisig: boolean }>;
    notify: (message: string) => Promise<void>;
    getProvider: () => any;
  }
): Promise<{ success: boolean; message: string; data: TransactionReturnData[]; isMultisig: boolean }> {
  const { chainName, account, tokenIn, amount } = params;
  
  // Validate required parameters
  if (!chainName || !account || !tokenIn || !amount) {
    throw new Error('Missing required parameters');
  }

  // Validate network
  if (!Object.values(NETWORKS).includes(chainName)) {
    throw new Error(`Network ${chainName} not supported`);
  }

  const publicClient = callbacks.getProvider();
  const amountInWei = parseUnits(amount, 18);

  // Calculate minOut if not provided
  const minOutWei = params.minOut ? 
    parseUnits(params.minOut, 18) : 
    await calculateMinGlp(publicClient, chainName, amountInWei);

  // Encode function data for addLiquidity
  const data = encodeFunctionData({
    abi: GLPManagerABI.abi as Abi,
    functionName: 'addLiquidity',
    args: [tokenIn, amountInWei, amountInWei, minOutWei] // minUsdg = amountInWei for 1:1 conversion
  });

  // Prepare transaction
  const transactions = [{
    target: CONTRACT_ADDRESSES[chainName as keyof typeof NETWORKS].GLP_MANAGER,
    data
  }];

  // Send transaction
  return await callbacks.sendTransactions({ transactions });
}