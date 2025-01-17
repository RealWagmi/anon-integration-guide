import { ChainId, getChainName } from '@heyanon/sdk';
import { NetworkName } from './types';

export const supportedChains = [ChainId.ETHEREUM, ChainId.BSC, ChainId.BASE, ChainId.AVALANCHE, ChainId.ARBITRUM, ChainId.SONIC];

export const chainIdToNetworkNameMap = new Map();
chainIdToNetworkNameMap.set(ChainId.ETHEREUM, NetworkName.Ethereum);
chainIdToNetworkNameMap.set(ChainId.BSC, NetworkName.Bsc);
chainIdToNetworkNameMap.set(ChainId.BASE, NetworkName.Base);
chainIdToNetworkNameMap.set(ChainId.AVALANCHE, NetworkName.Avalanche);
chainIdToNetworkNameMap.set(ChainId.ARBITRUM, NetworkName.Arbitrum);
chainIdToNetworkNameMap.set(ChainId.SONIC, NetworkName.Sonic);

export const networkIdToChainNameMap = new Map();
networkIdToChainNameMap.set(1, getChainName(ChainId.ETHEREUM));
networkIdToChainNameMap.set(3, getChainName(ChainId.BSC));
networkIdToChainNameMap.set(8, getChainName(ChainId.BASE));
networkIdToChainNameMap.set(4, getChainName(ChainId.AVALANCHE));
networkIdToChainNameMap.set(5, getChainName(ChainId.ARBITRUM));
networkIdToChainNameMap.set(17, getChainName(ChainId.SONIC));

export const MAGPIE_BASE_URL = 'https://api.magpiefi.xyz';

export const GETTER_LIMIT = 500;
