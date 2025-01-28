import { createPublicClient, http, formatUnits } from 'viem';
import { sonic } from './constants';

async function checkVault() {
  const publicClient = createPublicClient({
    chain: sonic,
    transport: http('https://rpc.soniclabs.com')
  });

  const tokens = {
    'WETH': '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    'USDC': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    'EURC': '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
    'ANON': '0x7d82F56ea0820A9d42b01C3C28F1997721732218',
    'S': '0x0000000000000000000000000000000000000000'
  };

  const vaultAddress = '0x11944027D4eDC1C17db2D5E9020530dcEcEfb85b';

  for (const [name, addr] of Object.entries(tokens)) {
    console.log(`\n=== ${name} ===`);
    try {
      const [maxLong, pool, reserved] = await Promise.all([
        publicClient.readContract({
          address: vaultAddress,
          abi: [{
            inputs: [{ name: '_token', type: 'address' }],
            name: 'maxGlobalLongSizes',
            outputs: [{ type: 'uint256' }],
            stateMutability: 'view',
            type: 'function'
          }],
          functionName: 'maxGlobalLongSizes',
          args: [addr]
        }),
        publicClient.readContract({
          address: vaultAddress,
          abi: [{
            inputs: [{ name: '_token', type: 'address' }],
            name: 'poolAmounts',
            outputs: [{ type: 'uint256' }],
            stateMutability: 'view',
            type: 'function'
          }],
          functionName: 'poolAmounts',
          args: [addr]
        }),
        publicClient.readContract({
          address: vaultAddress,
          abi: [{
            inputs: [{ name: '_token', type: 'address' }],
            name: 'reservedAmounts',
            outputs: [{ type: 'uint256' }],
            stateMutability: 'view',
            type: 'function'
          }],
          functionName: 'reservedAmounts',
          args: [addr]
        })
      ]);

      console.log('Max Long:', formatUnits(maxLong, 30));
      console.log('Pool Amount:', formatUnits(pool, 18));
      console.log('Reserved Amount:', formatUnits(reserved, 18));
    } catch (e) {
      console.error('Error:', e);
    }
  }
}

checkVault().catch(console.error); 