import { createPublicClient, createWalletClient, http, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CHAIN_CONFIG, NETWORKS } from './constants';
import dotenv from 'dotenv';

dotenv.config();

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  throw new Error('Private key not found in environment variables');
}

async function test() {
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const chain = CHAIN_CONFIG[NETWORKS.SONIC];

  const publicClient = createPublicClient({
    chain,
    transport: http('https://rpc.soniclabs.com')
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http('https://rpc.soniclabs.com')
  });

  // The Router contract that handles native token deposits
  const ROUTER_ADDRESS = '0xA0411BBefDC6d896615d1ece1C3212353842C2dF';
  
  // For 0.1 native token input
  const amount = parseEther('0.1');
  
  // Min GLP with 1% slippage = 0.1287 GLP
  const minOut = BigInt('128700000000000000');

  // Encode function data for addLiquidityNative
  const data = `0x${
    // Function selector for addLiquidityNative(uint256)
    '53a8aa03' +
    // _minOut parameter (uint256)
    minOut.toString(16).padStart(64, '0')
  }`;

  try {
    const hash = await walletClient.sendTransaction({
      to: ROUTER_ADDRESS,
      data: data as `0x${string}`,
      value: amount,
      gas: 1500000n
    });
    console.log('Transaction hash:', hash);
  } catch (error) {
    console.error('Error:', error);
  }
}

test(); 