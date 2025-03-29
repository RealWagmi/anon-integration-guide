import { Address, Chain } from 'viem';

// Constants for APR calculations
export const PRECISION = 1e30;
export const SECONDS_PER_YEAR = 31536000; // 365 * 24 * 60 * 60
export const BASIS_POINTS_DIVISOR = 10000;

// Supported chains
export const supportedChains = [146, 8453] as const;

// Other global constants can go here

export const NETWORKS = {
    SONIC: 'sonic',
    BASE: 'base'
} as const;

export const CHAIN_IDS = {
    [NETWORKS.SONIC]: 146,
    [NETWORKS.BASE]: 8453
} as const;

export const RPC_URLS = {
    [NETWORKS.SONIC]: 'https://rpc.soniclabs.com',
    [NETWORKS.BASE]: 'https://mainnet.base.org'
} as const;

export const EXPLORER_URLS = {
    [NETWORKS.SONIC]: 'https://sonicscan.org',
    [NETWORKS.BASE]: 'https://basescan.org'
} as const;

// Mapping from deploy-base.json names to more consistent names used in Sonic config
// This simplifies referencing addresses later
const BASE_CONTRACT_NAME_MAPPING: Record<string, string> = {
    "GlpManager": "GLP_MANAGER",
    "GLP": "GLP_TOKEN",
    "RewardRouterV2": "REWARD_ROUTER",
    "RewardDistributorFeeGLP": "REWARD_DISTRIBUTOR",
    "RewardTrackerFeeStakedGLP": "REWARD_TRACKER",
    "Vault": "VAULT",
    "nativeToken": "NATIVE_TOKEN",
    "weth": "WRAPPED_NATIVE_TOKEN",
    "usdc": "USDC",
    "Router": "ROUTER",
    "PositionRouter": "POSITION_ROUTER",
    "VaultPriceFeed": "VAULT_PRICE_FEED",
    "VesterGLP": "ALP_VESTER",
    "cbbtc": "CBBTC"
};

// Base contract addresses from deploy-base.json
const baseContractsRaw = [{"name":"usdc","imple":"0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"},{"name":"weth","imple":"0x4200000000000000000000000000000000000006"},{"name":"cbbtc","imple":"0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf"},{"name":"MultiSigner1","imple":"0xd795C3E9DccA7d3Fe9A6C9149e756cE06ed5e380"},{"name":"MultiSigner2","imple":"0x2390b12FA119d0D10cd97C64e76DA986B4E8394c"},{"name":"MultiSigner3","imple":"0x17595cF7879Af4156BbbbA9EF6231f73C5d44810"},{"name":"MultiSigner4","imple":"0x7e8B7cfADc33C6a54FAeFA59a23d8a9149f1515f"},{"name":"MultiSigner5","imple":"0x62c706D06865D6D26905A2c3495dF280755FCfa0"},{"name":"MultiSigner6","imple":"0x7Fac2B2784523ef7Ddba64C97D611E3779d3291D"},{"name":"nativeToken","imple":"0x4200000000000000000000000000000000000006"},{"name":"GMX","imple":"0xAc611438AE5F3953DeDB47c2ea8d6650D601C1B4"},{"name":"Multicall3","imple":"0xf669bA7d9a4393B509B1209Dcdc5ab44cD62b4A8"},{"name":"Vault","imple":"0xed33E4767B8d68bd7F64c429Ce4989686426a926"},{"name":"USDG","imple":"0x3312C9044640De2Ab0B8d7dd249070760FdB2bf9"},{"name":"Router","imple":"0x700d165ef6e5c79b9BD83D2C328391FE61917af6"},{"name":"VaultPriceFeed","imple":"0x2d918cBEbc9818FB372E2327bc6709132Aa17A71"},{"name":"GLP","imple":"0x317b79Ac01Ed43755F72472B04ad31297e33ab98"},{"name":"ShortsTracker","imple":"0xCe0a0e2BbA0F2168DD614b1414CfE707c13aa081"},{"name":"GlpManager","imple":"0xD24c217230DAf4036E290133861EfF4B9aDB2b27"},{"name":"VaultErrorController","imple":"0x3C9065388DDD5b1fd3bC5fC8C2AfC794358283c0"},{"name":"VaultUtils","imple":"0xb6600B4328e417d21a7CfbAa11758F57A0E5A3E6"},{"name":"VaultReader","imple":"0xceC73796Bc168367952eA7526A101cB6B1eD3d72"},{"name":"Reader","imple":"0xB895e3DBFB37A4Cc6b4FB50B1cf903608e942FF9"},{"name":"RewardReader","imple":"0x2a7663A3e6961dC43bEcbF752DcC9798C1c22a6A"},{"name":"EsGMX","imple":"0x98e3F8d172ecD7e897d4408a5a12d66Cb26a8793"},{"name":"EsGMXIOU","imple":"0x36b4Cf6AAc883Dc75CAFf2EE4E160b007B40ee79"},{"name":"BonusGMX","imple":"0xF1C2778cb4165DdeA8051f95B9c7eeB9DE182bB6"},{"name":"RewardTrackerStakedGMX","imple":"0x9e45B1f3983e5BD6480C39f57F876df0eda8EA74"},{"name":"RewardDistributorStakedGMX","imple":"0x7065e593cBc2671Fd44f3ECfD88533007c32c63a"},{"name":"RewardTrackerStakedBonusGMX","imple":"0x3e3fD03113d10d81706d2f5c0F3dC04B8d2af9F6"},{"name":"BonusDistributorStakedGMX","imple":"0xA28227bb9D168dDBe6E7Ba8c9c581150E4995df7"},{"name":"RewardTrackerStakedBonusFeeGMX","imple":"0x945f2677E5CCB4eeb98E16a3Eb416e1d0dcc0610"},{"name":"RewardDistributorStakedBonusFeeGMX","imple":"0x931d5560D236e0780FD872331e28D7598E0DeDcc"},{"name":"RewardTrackerFeeGLP","imple":"0x1dc520F6be4A24691a3FC40470d7C7620D1a07a3"},{"name":"RewardDistributorFeeGLP","imple":"0xf9e2AA1bcA944fd78622712f82Fd6B1E5358935E"},{"name":"RewardTrackerFeeStakedGLP","imple":"0x12905Eb64C3A70c6a7D3E1f0A4BA3213C23BE051"},{"name":"RewardDistributorFeeStakedGLP","imple":"0x15602eD2C2A4c9Fb91EdC884D215de94b3769276"},{"name":"VesterGMX","imple":"0xEe773Ed72CfCfB2312Dda8a72479d045a2520f36"},{"name":"VesterGLP","imple":"0x059580aC18587202FE37AA53D29f44D42dF992b4"},{"name":"RewardRouterV2","imple":"0xa9B2E867520EbD705018a4E088057bE1cdBB2A78"},{"name":"OrderBook","imple":"0x308B06b2c91705af88E2f90aB978084EB15955DC"},{"name":"OrderBookReader","imple":"0x48dC70cb7De65180B3f316e3Cf9FD81335f7E0ED"},{"name":"ReferralStorage","imple":"0xD467Fd4657e8B82B70Db58F7B1031c4e15af44c5"},{"name":"ReferralReader","imple":"0xBAB693bcae9e05AC907D1d0bAB3D852671B6571b"},{"name":"TokenManager","imple":"0xA90Da7023Cb46d67A7875e462D054713CBa28c32"},{"name":"PriceFeedTimelock","imple":"0xd806306Dc9bF7984a7D5cA997D40D18097D2AaB8"},{"name":"Timelock","imple":"0x69E44517D74709d552A69046585bef02d8c34D5B"},{"name":"ShortsTrackerTimelock","imple":"0x6183BbDA0Bb5ADED43A87d32b0Ec08b1b0bE7354"},{"name":"PositionUtils","imple":"0x8E7BFbA8871D8AE7E3F9451B1c2DE98A9466fADD"},{"name":"PositionRouter","imple":"0xff2B2953C11D1B431Fa03dAA12489124d8E47BdB"},{"name":"PositionManager","imple":"0x5384E8bc4d1C235dC479001A23DECf4A3662E3fF"},{"name":"FastPriceEvents","imple":"0x29707C9F83fEb497Df7350Aefc5856D41e7393d5"},{"name":"FastPriceFeed","imple":"0xFC909d41d0628b36334E6235Cf954777Cece471a"},{"name":"GLPRewardRouterV2","imple":"0x3e4517ad00B0336886E67aedD146160EB51f35ed"}];

const baseContracts: Record<string, Address> = baseContractsRaw.reduce((acc, contract) => {
    const mappedName = BASE_CONTRACT_NAME_MAPPING[contract.name];
    if (mappedName) {
        acc[mappedName] = contract.imple as Address;
    } else {
        acc[contract.name] = contract.imple as Address;
    }
    return acc;
}, {} as Record<string, Address>);

// Add the NATIVE_TOKEN address specifically for Base (often 0xeeee...)
baseContracts['NATIVE_TOKEN'] = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Address;

// Add the VIRTUAL token address for Base
baseContracts['VIRTUAL'] = '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b' as Address;

export const CONTRACT_ADDRESSES: Record<string, Record<string, Address>> = {
    [NETWORKS.SONIC]: {
        GLP_MANAGER: '0x4DE729B85dDB172F1bb775882f355bA25764E430' as Address,
        GLP_TOKEN: '0x6fbaeE8bEf2e8f5c34A08BdD4A4AB777Bd3f6764' as Address,
        REWARD_ROUTER: '0xE72A2d5B3b09c88D4E8Cc60e74BD438d7168e80F' as Address,
        REWARD_DISTRIBUTOR: '0xfcb51C49cE6A23d370797a7E3e601046b43B6172' as Address,
        REWARD_TRACKER: '0x765d548229169E14b397c8c87FF7E8a64f36F469' as Address,
        VAULT: '0x5B8caae7cC6Ea61fb96Fd251C4Bc13e48749C7Da' as Address,
        NATIVE_TOKEN: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Address,
        WRAPPED_NATIVE_TOKEN: '0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38' as Address,
        WETH: '0x50c42deacd8fc9773493ed674b675be577f2634b' as Address,
        USDC: '0x29219dd400f2bf60e5a23d13be72b486d4038894' as Address,
        ANON: '0x79bbf4508b1391af3a0f4b30bb5fc4aa9ab0e07c' as Address,
        ROUTER: '0x451D212c080267feF47Fd777002C9186e61C5a2C' as Address,
        POSITION_ROUTER: '0x69E44517D74709d552A69046585bef02d8c34D5B' as Address,
        VAULT_PRICE_FEED: '0x51B9fcDF00423D597066A8a041ab38152a74Fe96' as Address,
        FS_ALP: '0xfb0e5aabfac2f946d6f45fcd4303ff721a4e3237' as Address,
        ALP_VESTER: '0x931d5560D236e0780FD872331e28D7598E0DeDcc' as Address
    },
    [NETWORKS.BASE]: baseContracts
} as const;

export const CHAIN_CONFIG: Record<typeof NETWORKS[keyof typeof NETWORKS], Chain> = {
    [NETWORKS.SONIC]: {
        id: CHAIN_IDS.sonic,
        name: NETWORKS.SONIC,
        network: NETWORKS.SONIC,
        nativeCurrency: {
            name: 'Sonic',
            symbol: 'S',
            decimals: 18,
        },
        rpcUrls: {
            default: {
                http: [RPC_URLS.sonic],
            },
            public: {
                http: [RPC_URLS.sonic],
            },
        },
        blockExplorers: {
            default: { name: 'SonicScan', url: EXPLORER_URLS.sonic }
        }
    },
    [NETWORKS.BASE]: {
        id: CHAIN_IDS.base,
        name: NETWORKS.BASE,
        network: NETWORKS.BASE,
        nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrls: {
            default: {
                http: [RPC_URLS.base],
            },
            public: {
                http: [RPC_URLS.base],
            },
        },
        blockExplorers: {
            default: { name: 'BaseScan', url: EXPLORER_URLS.base }
        }
    },
} as const;

// Helper type to get network names
export type SupportedNetwork = typeof NETWORKS[keyof typeof NETWORKS];
