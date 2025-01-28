import { ChainId, NATIVE_ADDRESS } from '@heyanon/sdk';

export const supportedChains = [
    ChainId.ETHEREUM,
    ChainId.OPTIMISM,
    ChainId.BSC,
    ChainId.GNOSIS,
    ChainId.POLYGON,
    ChainId.ZKSYNC,
    ChainId.BASE,
    ChainId.ARBITRUM,
    ChainId.AVALANCHE,
    ChainId.SEPOLIA,
];

export const TRANSFER_EVENT_SIG = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' as const;

export const ENSO_API = 'https://api.enso.finance/api/v1' as const;
// TODO: Need to create an API key, the documentation API cannot handle route otherwise
export const ENSO_API_TOKEN = '1e02632d-6feb-4a75-a157-documentation' as const;

export const ENSO_ETH = NATIVE_ADDRESS;
