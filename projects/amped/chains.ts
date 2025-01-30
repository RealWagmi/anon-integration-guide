import { defineChain } from 'viem';

export const sonic = defineChain({
  id: 146,
  name: 'Sonic',
  network: 'sonic',
  nativeCurrency: {
    decimals: 18,
    name: 'S',
    symbol: 'S',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sonic.fantom.network'],
    },
    public: {
      http: ['https://rpc.sonic.fantom.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'SonicScan',
      url: 'https://explorer.sonic.fantom.network',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 1,
    },
  },
}); 