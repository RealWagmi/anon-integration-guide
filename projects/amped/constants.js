var _a, _b, _c, _d;
// Constants for APR calculations
export var PRECISION = 1e30;
export var SECONDS_PER_YEAR = 31536000; // 365 * 24 * 60 * 60
// Other global constants can go here
export var NETWORKS = {
    SONIC: 'sonic'
};
export var CHAIN_IDS = (_a = {},
    _a[NETWORKS.SONIC] = 146,
    _a);
export var RPC_URLS = (_b = {},
    _b[NETWORKS.SONIC] = 'https://rpc.soniclabs.com',
    _b);
export var CONTRACT_ADDRESSES = (_c = {},
    _c[NETWORKS.SONIC] = {
        GLP_MANAGER: '0xA16FaBE630E75981b03b31AAD20F5BDDE581acDF',
        GLP_TOKEN: '0x5d51a52D952A61D5d1fc19F90a8244b995877bd9',
        REWARD_ROUTER: '0xA0411BBefDC6d896615d1ece1C3212353842C2dF',
        VAULT: '0x11944027D4eDC1C17db2D5E9020530dcEcEfb85b',
        NATIVE_TOKEN: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
        WETH: '0x50c42deacd8fc9773493ed674b675be577f2634b',
        USDC: '0x29219dd400f2bf60e5a23d13be72b486d4038894',
        EURC: '0xe715cbA7B5cCb33790ceBFF1436809d36cb17E57',
        ANON: '0x79bbf4508b1391af3a0f4b30bb5fc4aa9ab0e07c',
        ROUTER: '0x96EFEcB86b3408de4F92454E30a0c99E58299F35',
        POSITION_ROUTER: '0x82546eCf796C28882d98FfF8aB9FC109DC86221a',
        VAULT_PRICE_FEED: '0x9c2C2177EcE50f44EfbD234fd6c816849D47F3c2'
    },
    _c);
export var CHAIN_CONFIG = (_d = {},
    _d[NETWORKS.SONIC] = {
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
    },
    _d);
export const supportedChains = Object.values(NETWORKS);
