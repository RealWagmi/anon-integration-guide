import { Address } from 'viem';

// Constants for APR calculations
export const PRECISION = 1e30;
export const SECONDS_PER_YEAR = 31536000; // 365 * 24 * 60 * 60
export const BASIS_POINTS_DIVISOR = 10000;

// Supported chains
export const supportedChains = [146] as const; // Sonic chain ID

// Other global constants can go here

export const NETWORKS = {
    SONIC: 'sonic'
} as const;

export const CHAIN_IDS = {
    [NETWORKS.SONIC]: 146
} as const;

export const RPC_URLS = {
    [NETWORKS.SONIC]: 'https://rpc.soniclabs.com'
} as const;

export const CONTRACT_ADDRESSES: Record<string, Record<string, Address>> = {
    [NETWORKS.SONIC]: {
        GLP_MANAGER: '0xA16FaBE630E75981b03b31AAD20F5BDDE581acDF' as Address,
        GLP_TOKEN: '0x5d51a52D952A61D5d1fc19F90a8244b995877bd9' as Address,
        REWARD_ROUTER: '0xA0411BBefDC6d896615d1ece1C3212353842C2dF' as Address,
        REWARD_DISTRIBUTOR: '0x069d9C2eec92f777e80F019f944B9a8f775b3634' as Address,
        REWARD_TRACKER: '0x21Efb5680d6127d6C39AE0d62D80cb9fc8935887' as Address,
        VAULT: '0x11944027D4eDC1C17db2D5E9020530dcEcEfb85b' as Address,
        NATIVE_TOKEN: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38' as Address,
        WETH: '0x50c42deacd8fc9773493ed674b675be577f2634b' as Address,
        USDC: '0x29219dd400f2bf60e5a23d13be72b486d4038894' as Address,
        EURC: '0xe715cbA7B5cCb33790ceBFF1436809d36cb17E57' as Address,
        ANON: '0x79bbf4508b1391af3a0f4b30bb5fc4aa9ab0e07c' as Address,
        ROUTER: '0x96EFEcB86b3408de4F92454E30a0c99E58299F35' as Address,
        POSITION_ROUTER: '0x82546eCf796C28882d98FfF8aB9FC109DC86221a' as Address,
        VAULT_PRICE_FEED: '0x9c2C2177EcE50f44EfbD234fd6c816849D47F3c2' as Address,
        FS_ALP: '0xfb0e5aabfac2f946d6f45fcd4303ff721a4e3237' as Address, // Fee + Staked ALP token
        ALP_VESTER: '0xE3C124f417bE01e4fA373892CFdcd1b0c4b8996F' as Address // VesterGLP
    }
} as const;

export const CHAIN_CONFIG = {
    [NETWORKS.SONIC]: {
        id: CHAIN_IDS[NETWORKS.SONIC],
        name: NETWORKS.SONIC,
        network: NETWORKS.SONIC,
        nativeCurrency: { 
            name: 'Sonic', 
            symbol: 'S', 
            decimals: 18 
        },
        rpcUrls: {
            default: { 
                http: [RPC_URLS[NETWORKS.SONIC]] 
            }
        }
    }
} as const;
