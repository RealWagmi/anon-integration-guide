import { describe, it, expect } from 'vitest';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, NETWORKS, RPC_URLS } from '../../constants.js';
import { getUserLiquidity } from './getUserLiquidity';
import { PublicClient } from 'viem';

describe('getUserLiquidity', () => {
  // Create a provider for Sonic chain
  const provider = new ethers.JsonRpcProvider(RPC_URLS[NETWORKS.SONIC]);

  // Test addresses to check
  const addresses = [
    '0xb51e46987fB2AAB2f94FD96BfE5d8205303D9C17', // Your address from private key
    '0x7c34f87f0918ad182114a05d4b51ec4433bd5bd8', // Another address to test
    '0xfb0e5aabfac2f946d6f45fcd4303ff721a4e3237'  // FS_ALP contract itself
  ];

  // ERC20 ABI for balanceOf function
  const erc20Abi = [
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)'
  ];

  it('should fetch ALP balances for multiple addresses', async () => {
    console.log('\nQuerying ALP balances on Sonic chain...');
    console.log('----------------------------------------');
    
    const fsAlpAddress = CONTRACT_ADDRESSES[NETWORKS.SONIC].FS_ALP;
    const fsAlpContract = new ethers.Contract(fsAlpAddress, erc20Abi, provider);
    
    try {
      // First get token info
      const symbol = await fsAlpContract.symbol();
      const decimals = await fsAlpContract.decimals();
      console.log(`\nToken: ${symbol}`);
      console.log(`Decimals: ${decimals}`);
    } catch (error) {
      console.log('Error fetching token info:', error);
    }

    for (const address of addresses) {
      console.log(`\nChecking address: ${address}`);
      
      try {
        const balance = await fsAlpContract.balanceOf(address);
        console.log(`Balance: ${ethers.formatUnits(balance, 18)} ALP`);
      } catch (error) {
        console.log('Error fetching balance:', error);
      }
    }
  });
});

async function test() {
    const result = await getUserLiquidity(
        {
            chainName: 'sonic',
            account: '0xB1A9056a5921C0F6f2C68Ce19E08cA9A6D5FD904'
        },
        {
            notify: async (msg: string) => console.log('Notification:', msg),
            getProvider: (chainId: number): PublicClient => {
                if (chainId !== 146) throw new Error('Invalid chain ID');
                return {} as PublicClient;
            }
        }
    );
    console.log('Result:', result);
}

test().catch(console.error); 
