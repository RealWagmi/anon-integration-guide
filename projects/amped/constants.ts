import { Address, Chain } from 'viem';

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

export const EXPLORER_URLS = {
    [NETWORKS.SONIC]: 'https://sonicscan.org'
} as const;

export const CONTRACT_ADDRESSES: Record<string, Record<string, Address>> = {
    [NETWORKS.SONIC]: {
        GLP_MANAGER: '0x4DE729B85dDB172F1bb775882f355bA25764E430' as Address,
        GLP_TOKEN: '0x6fbaeE8bEf2e8f5c34A08BdD4A4AB777Bd3f6764' as Address,
        REWARD_ROUTER: '0xE72A2d5B3b09c88D4E8Cc60e74BD438d7168e80F' as Address,
        REWARD_DISTRIBUTOR: '0xfcb51C49cE6A23d370797a7E3e601046b43B6172' as Address,
        REWARD_TRACKER: '0x765d548229169E14b397c8c87FF7E8a64f36F469' as Address,
        VAULT: '0x5B8caae7cC6Ea61fb96Fd251C4Bc13e48749C7Da' as Address,
        NATIVE_TOKEN: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Address, // Native token (S)
        WRAPPED_NATIVE_TOKEN: '0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38' as Address, // Wrapped native token (wS)
        WETH: '0x50c42deacd8fc9773493ed674b675be577f2634b' as Address,
        USDC: '0x29219dd400f2bf60e5a23d13be72b486d4038894' as Address,
        ANON: '0x79bbf4508b1391af3a0f4b30bb5fc4aa9ab0e07c' as Address,
        ROUTER: '0x451D212c080267feF47Fd777002C9186e61C5a2C' as Address,
        POSITION_ROUTER: '0x69E44517D74709d552A69046585bef02d8c34D5B' as Address,
        VAULT_PRICE_FEED: '0x51B9fcDF00423D597066A8a041ab38152a74Fe96' as Address,
        FS_ALP: '0xfb0e5aabfac2f946d6f45fcd4303ff721a4e3237' as Address, // Fee + Staked ALP token
        ALP_VESTER: '0x931d5560D236e0780FD872331e28D7598E0DeDcc' as Address // VesterGLP
    }
} as const;

export const CHAIN_CONFIG: Record<typeof NETWORKS[keyof typeof NETWORKS], Chain> = {
    [NETWORKS.SONIC]: {
        id: 146,
        name: 'sonic',
        network: 'sonic',
        nativeCurrency: {
            name: 'Sonic',
            symbol: 'S',
            decimals: 18,
        },
        rpcUrls: {
            default: {
                http: ['https://rpc.soniclabs.com'],
            },
            public: {
                http: ['https://rpc.soniclabs.com'],
            },
        },
    },
} as const;
