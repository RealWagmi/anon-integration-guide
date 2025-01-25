import { Address, createPublicClient, createWalletClient, encodeFunctionData, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sonic } from 'viem/chains';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../../constants';

export interface LimitSwapParams {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  priceRatioBps: number; // Target price ratio in basis points relative to current price (e.g. 9500 = 95% of current price)
  slippageBps?: number; // Basis points (e.g. 100 = 1%)
  executionFee?: bigint;
  shouldWrap?: boolean;
  shouldUnwrap?: boolean;
  privateKey: string;
}

export interface LimitSwapResult {
  success: boolean;
  message: string;
  data: {
    hash: `0x${string}`;
    message: string;
    tokenInPrice?: bigint;
    tokenOutPrice?: bigint;
    currentRatio?: bigint;
    triggerRatio?: bigint;
    expectedOut?: bigint;
    minOut?: bigint;
  };
  isMultisig: boolean;
}

const ROUTER_ABI = [{
  inputs: [
    { name: '_path', type: 'address[]' },
    { name: '_amountIn', type: 'uint256' },
    { name: '_minOut', type: 'uint256' },
    { name: '_triggerRatio', type: 'uint256' },
    { name: '_triggerAboveThreshold', type: 'bool' },
    { name: '_executionFee', type: 'uint256' },
    { name: '_shouldWrap', type: 'bool' },
    { name: '_shouldUnwrap', type: 'bool' }
  ],
  name: 'createSwapOrder',
  outputs: [{ type: 'bytes32' }],
  stateMutability: 'payable',
  type: 'function'
}, {
  inputs: [
    { name: '_plugin', type: 'address' }
  ],
  name: 'approvePlugin',
  outputs: [],
  stateMutability: 'nonpayable',
  type: 'function'
}] as const;

const ERC20_ABI = [{
  inputs: [
    { name: 'spender', type: 'address' },
    { name: 'amount', type: 'uint256' }
  ],
  name: 'approve',
  outputs: [{ type: 'bool' }],
  stateMutability: 'nonpayable',
  type: 'function'
}] as const;

export async function limitSwap({
  tokenIn,
  tokenOut,
  amountIn,
  priceRatioBps,
  slippageBps = 100, // Default 1% slippage
  executionFee = 1000000000000000n, // Default 0.001 native token
  shouldWrap = false,
  shouldUnwrap = false,
  privateKey
}: LimitSwapParams): Promise<LimitSwapResult> {
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

  // First approve the order plugin
  const ORDER_PLUGIN = '0x5ec625389c3c1e76fe0c7d864b62a7c2a52c4b05' as const;
  console.log('Approving order plugin...');
  const approvePluginHash = await client.writeContract({
    address: CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER,
    abi: ROUTER_ABI,
    functionName: 'approvePlugin',
    args: [ORDER_PLUGIN],
    gas: 500000n
  });

  // Wait for plugin approval to be mined
  await publicClient.waitForTransactionReceipt({ hash: approvePluginHash });
  console.log('Plugin approved:', approvePluginHash);

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

  // Calculate current price ratio and trigger ratio
  const currentRatio = (tokenInPrice * 10000n) / tokenOutPrice;
  const triggerRatio = (currentRatio * BigInt(priceRatioBps)) / 10000n;
  
  // Calculate expected output and minimum output with slippage
  const expectedOut = (amountIn * tokenInPrice) / tokenOutPrice;
  const minOut = (expectedOut * BigInt(10000 - slippageBps)) / 10000n;

  console.log('Debug values:');
  console.log('Token path:', [tokenIn, tokenOut]);
  console.log('Amount in:', amountIn.toString());
  console.log('Min out:', minOut.toString());
  console.log('Trigger ratio:', triggerRatio.toString());
  console.log('Trigger above threshold:', priceRatioBps < 10000);
  console.log('Execution fee:', executionFee.toString());

  // First approve Router to spend tokenIn
  const approveHash = await client.writeContract({
    address: tokenIn,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER, amountIn],
    gas: 500000n
  });

  // Wait for approval to be mined
  await publicClient.waitForTransactionReceipt({ hash: approveHash });

  // Create limit order
  const orderHash = await client.writeContract({
    address: CONTRACT_ADDRESSES[NETWORKS.SONIC].ROUTER,
    abi: ROUTER_ABI,
    functionName: 'createSwapOrder',
    args: [
      [tokenIn, tokenOut],
      amountIn,
      minOut,
      triggerRatio,
      priceRatioBps < 10000,
      executionFee,
      shouldWrap,
      shouldUnwrap
    ],
    value: executionFee,
    gas: 1500000n
  });

  return {
    success: true,
    message: 'Limit order created',
    data: {
      hash: orderHash,
      message: 'Limit order created',
      tokenInPrice,
      tokenOutPrice,
      currentRatio,
      triggerRatio,
      expectedOut,
      minOut
    },
    isMultisig: false
  };
} 