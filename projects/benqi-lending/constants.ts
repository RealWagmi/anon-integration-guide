import { ChainId } from '@heyanon/sdk';

export const supportedChains = [ChainId.AVALANCHE];

export const MARKET_DECIMALS = 8;

export const CORE_COMPTROLLER_ADDRESS = '0x486Af39519B4Dc9a7fCcd318217352830E8AD9b4';
export const ECOSYSTEM_UNITROLLER_ADDRESS = '0xD7c4006d33DA2A0A8525791ed212bbCD7Aca763F';
export const AVAX_NAME = 'AVAX';

export const CORE_MARKETS = {
    AVAX: '0x5C0401e81Bc07Ca70fAD469b451682c0d747Ef1c',
    sAVAX: '0xF362feA9659cf036792c9cb02f8ff8198E21B4cB',
    BTCb: '0x89a415b3D20098E6A6C8f7a59001C67BD3129821',
    BTC: '0xe194c4c5aC32a3C9ffDb358d9Bfd523a0B6d1568',
    ETH: '0x334AD834Cd4481BB02d09615E7c11a00579A7909',
    LINK: '0x4e9f683A27a6BdAD3FC2764003759277e93696e6',
    USDT: '0xc9e5999b8e75C3fEB117F6f73E664b9f3C8ca65C',
    USDC: '0xBEb5d47A3f720Ec0a390d04b4d41ED7d9688bC7F',
    USDTn: '0xd8fcDa6ec4Bdc547C0827B8804e89aCd817d56EF',
    USDCn: '0xB715808a78F6041E46d61Cb123C9B4A27056AE9C',
    DAI: '0x835866d37AFB8CB8F8334dCCdaf66cf01832Ff5D',
    BUSD: '0x872670CcAe8C19557cC9443Eff587D7086b8043A',
    QI: '0x35Bd6aedA81a7E5FC7A7832490e71F757b0cD9Ce',
    AUSD: '0x190D94613A09ad7931FcD17CD6A8F9B6B47ad414',
} as const;

export const ECOSYSTEM_MARKETS = {
    USDC: '0x6B35Eb18BCA06bD7d66a428eeb45aC7d200C1e4E',
    COQ: '0x0eBfebD41e1eA83Be5e911cDCd2730a0CCEE344d',
    JOE: '0x4036cb0D6BF6b5F17Aa4e05191F86D4b1655b0d9',
    QI: '0x545356e396350D40cDEa888ad73534517399BF96',
    AUSD: '0xb7CfB8Ae67E20059021A0D20fc30311a6c67C734',
    SolvBTC: '0x0fFAc5aae14E28E79C5CCc7a335D8C70Ee458A3A',
} as const;

export type CoreMarketName = keyof typeof CORE_MARKETS;
export type EcosystemMarketName = keyof typeof ECOSYSTEM_MARKETS;

export type MarketProps =
    | {
          marketType: 'core';
          marketName: CoreMarketName;
      }
    | {
          marketType: 'ecosystem';
          marketName: EcosystemMarketName;
      };

export type MarketListProps =
    | {
          marketType: 'core';
          marketNames: CoreMarketName[];
      }
    | {
          marketType: 'ecosystem';
          marketNames: EcosystemMarketName[];
      };
