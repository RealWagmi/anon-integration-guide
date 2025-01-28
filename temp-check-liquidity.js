import { getUserLiquidity } from './projects/amped/functions/liquidity/getUserLiquidity.js';
import { createPublicClient, http } from 'viem';
import { CHAIN_CONFIG, NETWORKS } from './projects/amped/constants.js';

async function main() {
  const client = createPublicClient({
    chain: CHAIN_CONFIG[NETWORKS.SONIC],
    transport: http()
  });

  const result = await getUserLiquidity(
    {
      chainName: 'sonic',
      account: '0xb51e46987fB2AAB2f94FD96BfE5d8205303D9C17'
    },
    {
      notify: async (msg) => console.log(msg),
      getProvider: () => client,
      sendTransactions: async () => ({ 
        data: [{ 
          message: 'Transaction successful',
          hash: '0x1234567890123456789012345678901234567890123456789012345678901234'
        }], 
        isMultisig: false 
      })
    }
  );
  
  console.log('Result:', JSON.stringify(result, null, 2));
}

main().catch(console.error); 