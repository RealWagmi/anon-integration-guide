import { ChainId } from '@heyanon/sdk';

export const supportedChains = [ChainId.ARBITRUM];

export enum VaultAsset {
  USDC = 'USDC',
  WETH = 'WETH',
  WBTC = 'WBTC'
}

export const TOKEN_ADDRESSES = {
  [VaultAsset.USDC]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  [VaultAsset.WETH]: '0x82af49447d8a07e3bd95bd0d56f35241523fbab8',
  [VaultAsset.WBTC]: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'
} as const;

export enum VaultProtocol {
  TEAHOUSE = 'Teahouse',
  STEADEFI = 'Steadefi',
  KTX = 'KTX',
  RESERVE = 'Reserve',
  GAMMA = 'Gamma',
  ERC4626 = 'ERC4626'
}

export interface VaultInfo {
  name: string;
  address: string;
  asset: VaultAsset;
  protocol: VaultProtocol;
  version?: string;
  notes?: string;
}

export const VAULTS = {
  [ChainId.ARBITRUM]: [
    {
      name: 'Teahouse USDC',
      address: '0xbC89bAc7b3697120019D30154102403e846c665b',
      asset: VaultAsset.USDC,
      protocol: VaultProtocol.TEAHOUSE
    },
    {
      name: 'Teahouse WETH',
      address: '0x60059A0fC1AaB2b21561C8845E74Acab740A347F',
      asset: VaultAsset.WETH,
      protocol: VaultProtocol.TEAHOUSE
    },
    {
      name: 'Steadefi WETH',
      address: '0xE3a80A636161b6E105180A9b9CB6aD6209eC917e',
      asset: VaultAsset.WETH,
      protocol: VaultProtocol.STEADEFI
    },
    {
      name: 'Steadefi USDC',
      address: '0x14c1FC0E04C2ffB82c5A90486e3115801A238d51',
      asset: VaultAsset.USDC,
      protocol: VaultProtocol.STEADEFI
    },
    {
      name: 'Steadefi WBTC',
      address: '0x94303996E6ae470a2fe4b03A04f1bCc69C6D6895', 
      asset: VaultAsset.WBTC,
      protocol: VaultProtocol.STEADEFI
    },
    {
      name: 'KTX USDC',
      address: '0xB9c726bC4d9F00da48f3FD77cE30100CfB83648D',
      asset: VaultAsset.USDC,
      protocol: VaultProtocol.KTX
    },
    {
      name: 'KTX WETH',
      address: '0x1C047Ff881f9bbCf72C947e6f91eA70c95cd58b0',
      asset: VaultAsset.WETH,
      protocol: VaultProtocol.KTX
    },
    {
      name: 'KTX WBTC',
      address: '0x10179BA515f2a38B72f4fd14De993AFA0c4DC16e',
      asset: VaultAsset.WBTC,
      protocol: VaultProtocol.KTX
    },
    {
      name: 'Reserve WETH V1',
      address: '0xa6c486f9d87eccc91bac8d597ad09b5b4344feab',
      asset: VaultAsset.WETH,
      protocol: VaultProtocol.RESERVE,
      version: 'V1'
    },
    {
      name: 'Reserve USDC V1',
      address: '0x6A2E561Abd768392E2F5C32C2dfB79bF75840b57',
      asset: VaultAsset.USDC,
      protocol: VaultProtocol.RESERVE,
      version: 'V1'
    },
    {
      name: 'Reserve WETH V2',
      address: '0x9400d0e43eacfbdb11197ca92d32e7aee03c1508',
      asset: VaultAsset.WETH,
      protocol: VaultProtocol.RESERVE,
      version: 'V2',
      notes: 'CurveTwoCryptoOptimized'
    },
    {
      name: 'Reserve USDC V2',
      address: '0xAFFAd400997EA9F412Ec793cAb0Ee1adA18776a0',
      asset: VaultAsset.USDC,
      protocol: VaultProtocol.RESERVE,
      version: 'V2',
      notes: 'CurveTwoCryptoOptimized'
    },
    {
      name: 'Teahouse WETH (uniETH)',
      address: '0xa2EA80D2c66CABC50De584a4368F00b4fD487F77',
      asset: VaultAsset.WETH,
      protocol: VaultProtocol.TEAHOUSE,
      notes: 'uniETH'
    },
    {
      name: 'Gamma USDC',
      address: '0xab569f6274761ee641572859f223c1d4426edff4',
      asset: VaultAsset.USDC,
      protocol: VaultProtocol.GAMMA
    },
    {
      name: 'Gamma WETH',
      address: '0x9b21818bdeDeeC833ec0CE94600F385337Fa822f',
      asset: VaultAsset.WETH,
      protocol: VaultProtocol.GAMMA
    },
    {
      name: 'Teahouse USDC V2',
      address: '0x446eb85483cca836048739cc3596dae492e0c04a',
      asset: VaultAsset.USDC,
      protocol: VaultProtocol.TEAHOUSE,
      version: 'V2'
    },
    {
      name: 'Teahouse WETH V2',
      address: '0x35ae09110071d119969ba17c85efddcd82783b17',
      asset: VaultAsset.WETH,
      protocol: VaultProtocol.TEAHOUSE,
      version: 'V2'
    },
    {
      name: 'Reserve WETH V3',
      address: '0x3a101f92d78a617d9ef2ec5d0a894902f6b5d7c3',
      asset: VaultAsset.WETH,
      protocol: VaultProtocol.RESERVE,
      version: 'V3'
    }
  ],
};

// Helper functions
export const getVaultsByChain = (chainId: ChainId): VaultInfo[] => {
  return VAULTS[chainId] || [];
};

export const getVaultsByAsset = (chainId: ChainId, asset: VaultAsset): VaultInfo[] => {
  return getVaultsByChain(chainId).filter(vault => vault.asset === asset);
};

export const getVaultsByProtocol = (chainId: ChainId, protocol: VaultProtocol): VaultInfo[] => {
  return getVaultsByChain(chainId).filter(vault => vault.protocol === protocol);
};