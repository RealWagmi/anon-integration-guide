import { Address, createPublicClient, createWalletClient, encodeFunctionData, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sonic } from 'viem/chains';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants';

export interface AddLiquidityParams {
  token: Address;
  amount: bigint;
  slippageBps?: number; // Basis points (e.g. 100 = 1%)
  isNative?: boolean;
  privateKey: string;
}

export interface AddLiquidityResult {
  success: boolean;
  message: string;
  data: {
    hash: `0x${string}`;
    message: string;
    tokenPrice?: bigint;
    usdValue?: bigint;
    minUsdg?: bigint;
    minGlp?: bigint;
  };
  isMultisig: boolean;
}

export async function addLiquidity({
  token,
  amount,
  slippageBps = 100, // Default 1% slippage
  isNative = false,
  privateKey
}: AddLiquidityParams): Promise<AddLiquidityResult> {
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

  // Get token price from Vault
  const tokenPrice = await publicClient.readContract({
    address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
    abi: [{
      inputs: [{ name: '_token', type: 'address' }],
      name: 'getMinPrice',
      outputs: [{ type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    }],
    functionName: 'getMinPrice',
    args: [token]
  });

  // Calculate USD value and minimum outputs
  // Price is scaled by 1e30, amount by 1e18, so divide by 1e30
  const usdValue = (amount * tokenPrice) / 1000000000000000000000000000000n;
  const minUsdg = (usdValue * BigInt(10000 - slippageBps)) / 10000n;
  const minGlp = (minUsdg * BigInt(10000 - slippageBps)) / 10000n;

  let approveHash: `0x${string}` | undefined;

  // Only need approval for non-native tokens
  if (!isNative) {
    // Approve GLP Manager to spend token
    const approveData = encodeFunctionData({
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER, amount],
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

    approveHash = await client.sendTransaction({
      to: token,
      data: approveData,
      gas: 500000n
    });

    // Wait for approval to be mined
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
  }

  // Add liquidity using RewardRouter
  const mintData = encodeFunctionData({
    functionName: isNative ? 'mintAndStakeGlpETH' : 'mintAndStakeGlp',
    args: isNative ? [minUsdg, minGlp] : [token, amount, minUsdg, minGlp],
    abi: [{
      inputs: isNative ? [
        { name: '_minUsdg', type: 'uint256' },
        { name: '_minGlp', type: 'uint256' }
      ] : [
        { name: '_token', type: 'address' },
        { name: '_amount', type: 'uint256' },
        { name: '_minUsdg', type: 'uint256' },
        { name: '_minGlp', type: 'uint256' }
      ],
      name: isNative ? 'mintAndStakeGlpETH' : 'mintAndStakeGlp',
      outputs: [{ type: 'uint256' }],
      stateMutability: isNative ? 'payable' : 'nonpayable',
      type: 'function'
    }]
  });

  const mintHash = await client.sendTransaction({
    to: CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_ROUTER,
    data: mintData,
    value: isNative ? amount : 0n,
    gas: 1500000n
  });

  return {
    success: true,
    message: 'Add liquidity transaction sent',
    data: {
      hash: mintHash,
      message: 'Add liquidity transaction sent',
      tokenPrice,
      usdValue,
      minUsdg,
      minGlp
    },
    isMultisig: false
  };
}