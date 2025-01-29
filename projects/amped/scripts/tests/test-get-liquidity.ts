import { createPublicClient, http } from 'viem';
import { sonic } from 'viem/chains';
import { CONTRACT_ADDRESSES, NETWORKS } from './constants';

async function test() {
  const publicClient = createPublicClient({
    chain: sonic,
    transport: http('https://rpc.soniclabs.com')
  });

  // Let's check liquidity for ANON -> USDC swap
  const tokenIn = CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON;
  const tokenOut = CONTRACT_ADDRESSES[NETWORKS.SONIC].USDC;

  // Get pool and reserved amounts for the output token
  const [poolAmount, reservedAmount] = await Promise.all([
    publicClient.readContract({
      address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
      abi: [{
        inputs: [{ name: '_token', type: 'address' }],
        name: 'poolAmounts',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
      }],
      functionName: 'poolAmounts',
      args: [tokenOut]
    }),
    publicClient.readContract({
      address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
      abi: [{
        inputs: [{ name: '_token', type: 'address' }],
        name: 'reservedAmounts',
        outputs: [{ type: 'uint256' }],
        stateMutability: 'view',
        type: 'function'
      }],
      functionName: 'reservedAmounts',
      args: [tokenOut]
    })
  ]);

  // Calculate available amount for swaps
  const availableAmount = poolAmount - reservedAmount;

  // Get max in amount based on token price
  const maxInPrice = await publicClient.readContract({
    address: CONTRACT_ADDRESSES[NETWORKS.SONIC].VAULT,
    abi: [{
      inputs: [{ name: '_token', type: 'address' }],
      name: 'getMaxPrice',
      outputs: [{ type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    }],
    functionName: 'getMaxPrice',
    args: [tokenIn]
  });

  console.log({
    tokenIn,
    tokenOut,
    poolAmount: poolAmount.toString(),
    reservedAmount: reservedAmount.toString(),
    availableAmount: availableAmount.toString(),
    maxInPrice: maxInPrice.toString()
  });
}

test().catch(console.error); 