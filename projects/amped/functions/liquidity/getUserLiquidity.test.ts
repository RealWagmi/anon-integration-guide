import { describe, it, expect } from 'vitest';
import { getUserLiquidity } from './getUserLiquidity.js';
import { CONTRACT_ADDRESSES, NETWORKS } from '../../constants.js';
import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, http } from 'viem';
import * as dotenv from 'dotenv';
import { CHAIN_CONFIG } from '../../constants.js';
import { TransactionReturn } from '@heyanon/sdk';

dotenv.config();

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  throw new Error('PRIVATE_KEY not found in .env file');
}

const account = privateKeyToAccount(privateKey as `0x${string}`);
const client = createPublicClient({
  chain: CHAIN_CONFIG[NETWORKS.SONIC],
  transport: http(),
  batch: {
    multicall: true
  }
});

describe('getUserLiquidity', () => {
  it('should fetch user liquidity information', async () => {
    const result = await getUserLiquidity(
      {
        chainName: NETWORKS.SONIC as 'sonic',
        account: account.address
      },
      {
        notify: async () => {},
        getProvider: () => client,
        sendTransactions: async (): Promise<TransactionReturn> => ({ 
          data: [{ 
            message: 'Transaction successful',
            hash: '0x1234567890123456789012345678901234567890123456789012345678901234'
          }], 
          isMultisig: false 
        })
      }
    );

    console.log('User liquidity data:', result);

    if (!result.success) {
      // If there's an error, the test should fail
      throw new Error(`Expected success but got error: ${result.data}`);
    }

    // Parse the JSON string result
    const data = JSON.parse(result.data) as {
      balance: string;
      usdValue: string;
      alpPrice: string;
      claimableRewards: string;
    };

    expect(data).toBeDefined();
    expect(data.balance).toBeDefined();
    expect(data.usdValue).toBeDefined();
    expect(data.alpPrice).toBeDefined();
    expect(data.claimableRewards).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    const result = await getUserLiquidity(
      {
        chainName: NETWORKS.SONIC as 'sonic',
        account: '0x0000000000000000000000000000000000000000'
      },
      {
        notify: async () => {},
        getProvider: () => client,
        sendTransactions: async (): Promise<TransactionReturn> => ({ 
          data: [{ 
            message: 'Transaction successful',
            hash: '0x1234567890123456789012345678901234567890123456789012345678901234'
          }], 
          isMultisig: false 
        })
      }
    );

    expect(result.success).toBe(false);
    expect(typeof result.data).toBe('string');
    expect(result.data).toContain('Failed to fetch user liquidity');
  });
}); 
