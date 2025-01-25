import { parseEther, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, createPublicClient, http } from 'viem';
import { sonic } from 'viem/chains';
import 'dotenv/config';
import { CONTRACT_ADDRESSES, NETWORKS } from './constants';

async function test() {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not found in .env');
  }

  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  const client = createWalletClient({
    account,
    chain: sonic,
    transport: http('https://rpc.soniclabs.com')
  });

  const publicClient = createPublicClient({
    chain: sonic,
    transport: http('https://rpc.soniclabs.com')
  });

  // Amount of ANON to add (0.01)
  const amountIn = parseEther('0.01');
  
  // Get ANON token price from Vault
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
    args: [CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON]
  });

  console.log('ANON price:', tokenPrice.toString());

  // Use 0 for minUsdg to match successful transaction
  const minUsdg = 0n;
  // Calculate expected GLP output with 1% slippage
  const expectedGlp = 341917212328186124n;
  const minGlp = (expectedGlp * 99n) / 100n;

  console.log('Amount In:', amountIn.toString());
  console.log('Min USDG:', minUsdg.toString());
  console.log('Min GLP:', minGlp.toString());

  // First approve ANON token to GLP Manager
  const approveData = encodeFunctionData({
    functionName: 'approve',
    args: [CONTRACT_ADDRESSES[NETWORKS.SONIC].GLP_MANAGER, amountIn],
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
    to: CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
    data: approveData,
    gas: 500000n
  });

  console.log({
    success: true,
    message: 'Approval transaction sent',
    data: {
      hash: approveHash,
      message: 'Approval transaction sent'
    },
    isMultisig: false
  });

  // Wait for approval to be mined
  await publicClient.waitForTransactionReceipt({ hash: approveHash });

  // Now add liquidity
  const mintData = encodeFunctionData({
    functionName: 'mintAndStakeGlp',
    args: [
      CONTRACT_ADDRESSES[NETWORKS.SONIC].ANON,
      amountIn,
      minUsdg,
      minGlp
    ],
    abi: [{
      inputs: [
        { name: '_token', type: 'address' },
        { name: '_amount', type: 'uint256' },
        { name: '_minUsdg', type: 'uint256' },
        { name: '_minGlp', type: 'uint256' }
      ],
      name: 'mintAndStakeGlp',
      outputs: [{ type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function'
    }]
  });

  console.log('Mint transaction data:', mintData);

  const mintHash = await client.sendTransaction({
    to: CONTRACT_ADDRESSES[NETWORKS.SONIC].REWARD_ROUTER,
    data: mintData,
    gas: 1500000n
  });

  console.log({
    success: true,
    message: 'Mint transaction sent',
    data: {
      hash: mintHash,
      message: 'Mint transaction sent'
    },
    isMultisig: false
  });
}

test().catch(console.error); 