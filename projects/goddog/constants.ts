import { ChainId } from '@heyanon/sdk';
import dotenv from 'dotenv';
dotenv.config();

const infuraKey = process.env.INFURA_KEY;
export const supportedChains = [
    ChainId.ARBITRUM,
    // ChainId.BASE,
];
export const NETWORKS = {
  // BASE: 'base',
  ARBITRUM: 'arbitrum',
} as const;

export const CHAIN_IDS = {
  // [NETWORKS.BASE]: 8453,
  [NETWORKS.ARBITRUM]: 42161,
} as const;

export const RPC_URLS = {
  // [NETWORKS.BASE]: `https://base-mainnet.infura.io/v3/${infuraKey}`,
  [NETWORKS.ARBITRUM]: `https://arbitrum-mainnet.infura.io/v3/${infuraKey}`,
} as const;

export const CHAIN_CONFIG = {
  // [NETWORKS.BASE]: {
  //     id: CHAIN_IDS[NETWORKS.BASE],
  //     name: NETWORKS.BASE,
  //     network: NETWORKS.BASE,
  //     nativeCurrency: { 
  //         name: 'Ethereum', 
  //         symbol: 'ETH', 
  //         decimals: 18 
  //     },
  //     rpcUrls: {
  //         default: { 
  //             http: [RPC_URLS[NETWORKS.BASE]] 
  //         }
  //     }
  // },
  [NETWORKS.ARBITRUM]: {
    id: CHAIN_IDS[NETWORKS.ARBITRUM],
    name: NETWORKS.ARBITRUM,
    network: NETWORKS.ARBITRUM,
    nativeCurrency: { 
        name: 'Ethereum', 
        symbol: 'ETH', 
        decimals: 18 
    },
    rpcUrls: {
        default: { 
            http: [RPC_URLS[NETWORKS.ARBITRUM]] 
        }
    }
}
} as const;

export const protocolContracts = [
    {
      chainId: ChainId.ARBITRUM,
      routerAddress: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
      factoryAddress: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      BasicTokenAddress: "0x45940000009600102A1c002F0097C4A500fa00AB",
      vaultFactoryAddress: "0x5B7B8b487D05F77977b7ABEec5F922925B9b2aFa",
    },
    // {
    //   chainId: ChainId.BASE,
    //   routerAddress: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
    //   factoryAddress: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
    //   BasicTokenAddress: "0xDDf7d080C82b8048BAAe54e376a3406572429b4e",
    //   vaultFactoryAddress: "0x5B7B8b487D05F77977b7ABEec5F922925B9b2aFa",
    // },
  ];


export const DEBRIDGE_API_URL = 'https://deswap.debridge.finance/v1.0';
export const lowRange = 0.958;
export const highRange = 3.0;
export const managerAddress = "0xB05Cf01231cF2fF99499682E64D3780d57c80FdD";
export const maxTotalSupply =
    "115792089237316195423570985008687907853269984665640564039457584007913129639935";
