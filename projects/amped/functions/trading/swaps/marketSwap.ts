import { Address, createPublicClient, createWalletClient, encodeFunctionData, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sonic } from 'viem/chains';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants';

export interface MarketSwapParams {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  slippageBps?: number; // Basis points (e.g. 100 = 1%)
  privateKey: string;
}

export interface MarketSwapResult {
  success: boolean;
  message: string;
  data: {
    hash: `0x${string}`;
    message: string;
    tokenInPrice?: bigint;
    tokenOutPrice?: bigint;
    usdValue?: bigint;
    expectedOut?: bigint;
    minOut?: bigint;
  };
  isMultisig: boolean;
}

export async function marketSwap({
  tokenIn,
  tokenOut,
  amountIn,
  slippageBps = 100, // Default 1% slippage
  privateKey
}: MarketSwapParams): Promise<MarketSwapResult> {
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const client = createWalletClient({
    account,
    chain: sonic,
    transport: http('https://rpc.soniclabs.com')
  });

  const publicClient = createPublicClient({
    chain: sonic,
    transport: http('https://rpc.soniclabs.com')
  });

  // Get token prices from Vault
  const [tokenInPrice, tokenOutPrice] = await Promise.all([
    publicClient.readContract({
      address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
      abi: [{
        inputs: [{ name: '_token', type: 'address' }],
        name: 'getMinPrice',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
      }],
      functionName: 'getMinPrice',
      args: [tokenIn]
    }),
    publicClient.readContract({
      address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
      abi: [{
        inputs: [{ name: '_token', type: 'address' }],
        name: 'getMaxPrice',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
      }],
      functionName: 'getMaxPrice',
      args: [tokenOut]
    })
  ]);

  // Calculate USD value and expected output
  // Price is scaled by 1e30, convert to 18 decimals
  const usdValue = (amountIn * tokenInPrice) / (10n ** 30n);
  
  // Convert to output token decimals (assuming USDC with 6 decimals)
  // The usdValue is in 18 decimals, so divide by 10^12 to get to 6 decimals
  // Then reduce by 20% for fees and price impact
  const expectedOut = (usdValue / (10n ** 12n)) * 80n / 100n;
  
  // Apply slippage tolerance
  const minOut = (expectedOut * BigInt(10000 - slippageBps)) / 10000n;

  // First approve Router to spend tokenIn
  const approveData = encodeFunctionData({
    functionName: 'approve',
    args: [CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER, amountIn],
    abi: [{
      inputs: [
        { name: 'spender', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      name: 'approve',
      outputs: [{ type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function'
    }]
  });

  const approveHash = await client.sendTransaction({
    to: tokenIn,
    data: approveData,
    gas: 500000n
  });

  // Wait for approval to be mined
  await publicClient.waitForTransactionReceipt({ hash: approveHash });

  // Now swap tokens
  const swapData = encodeFunctionData({
    functionName: 'swap',
    args: [
      [tokenIn, tokenOut],
      amountIn,
      minOut,
      account.address
    ],
    abi: [{
      inputs: [
        { name: '_path', type: 'address[]' },
        { name: '_amountIn', type: 'uint256' },
        { name: '_minOut', type: 'uint256' },
        { name: '_receiver', type: 'address' }
      ],
      name: 'swap',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    }]
  });

  const swapHash = await client.sendTransaction({
    to: CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER,
    data: swapData,
    gas: 1500000n
  });

  return {
    success: true,
    message: 'Swap transaction sent',
    data: {
      hash: swapHash,
      message: 'Swap transaction sent',
      tokenInPrice,
      tokenOutPrice,
      usdValue,
      expectedOut,
      minOut
    },
    isMultisig: false
  };
} 