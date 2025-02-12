import {ChainId} from '@heyanon/sdk';
import {Address} from "viem";

export const supportedChains = [ChainId.BSC, ChainId.ETHEREUM, ChainId.BASE];

export const supportedPools = ['CORE', 'DEFI'];

export const VBNB_ADDRESS = '0xa07c5b74c9b40447a954e1466938b865b6bbea36'

export const XVS_STAKE_ADDRESS = '0x051100480289e704d20e9DB4804837068f3f9204'

export const XVS_TOKEN = "0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63"

export const ORACLE_ADDRESS = "0x6592b5DE802159F3E74B2486b091D11a8256ab8A"


interface Token {
    vTokenAddress: Address;
    vTokenDecimals: number;
    decimals: number;
    chainBased?: boolean;
}

interface CorePoolMarketTokens {
    [key: string]: Token;
}

interface TokenConfig {
    [chainId: number]: CorePoolMarketTokens;
}


interface PoolDetails {
    poolAddress: Address;
    poolTokens: TokenConfig;
}

interface Pool {
    [pool: string]: PoolDetails;
}

export const DEFI_POOL_MARKET_TOKENS: TokenConfig = {
    [ChainId.BSC]: {
        ALPACA: {
            vTokenAddress: "0x02c5Fb0F26761093D297165e902e96D08576D344",
            vTokenDecimals: 8,
            decimals: 18,
        },
        ANKR: {
            vTokenAddress: "0x19CE11C8817a1828D1d357DFBF62dCf5b0B2A362",
            vTokenDecimals: 8,
            decimals: 18,
        },
        ankrBNB: {
            vTokenAddress: "0x53728FD51060a85ac41974C6C3Eb1DaE42776723",
            vTokenDecimals: 8,
            decimals: 18,
        },
        BSW: {
            vTokenAddress: "0x8f657dFD3a1354DEB4545765fE6840cc54AFd379",
            vTokenDecimals: 8,
            decimals: 18,
        },
        PLANET: {
            vTokenAddress: "0xFf1112ba7f88a53D4D23ED4e14A117A2aE17C6be",
            vTokenDecimals: 8,
            decimals: 18,
        },
        TWT: {
            vTokenAddress: "0x736bf1D21A28b5DC19A1aC8cA71Fc2856C23c03F",
            vTokenDecimals: 8,
            decimals: 18,
        },
        USDD: {
            vTokenAddress: "0xA615467caE6B9E0bb98BC04B4411d9296fd1dFa0",
            vTokenDecimals: 8,
            decimals: 18,
        },
        USDT: {
            vTokenAddress: "0x1D8bBDE12B6b34140604E18e9f9c6e14deC16854",
            vTokenDecimals: 8,
            decimals: 18,
        },
    }
}

export const CORE_POOL_MARKET_TOKENS: TokenConfig = {
    [ChainId.BSC]: {
        AAVE: {
            vTokenAddress: "0x26DA28954763B92139ED49283625ceCAf52C6f94",
            vTokenDecimals: 8,
            decimals: 18,
        },
        ADA: {
            vTokenAddress: "0x9A0AF7FDb2065Ce470D72664DE73cAE409dA28Ec",
            vTokenDecimals: 8,
            decimals: 18,
        },
        BCH: {
            vTokenAddress: "0x5F0388EBc2B94FA8E123F404b79cCF5f40b29176",
            vTokenDecimals: 8,
            decimals: 18,
        },
        BETH: {
            vTokenAddress: "0x972207A639CC1B374B893cc33Fa251b55CEB7c07",
            vTokenDecimals: 8,
            decimals: 18,
        },
        BNB: {
            vTokenAddress: "0xA07c5b74C9B40447a954e1466938b865b6BBea36",
            vTokenDecimals: 8,
            decimals: 18,
            chainBased: true,
        },
        BTCB: {
            vTokenAddress: "0x882C173bC7Ff3b7786CA16dfeD3DFFfb9Ee7847B",
            vTokenDecimals: 8,
            decimals: 18,
        },
        BUSD: {
            vTokenAddress: "0x95c78222B3D6e262426483D42CfA53685A67Ab9D",
            vTokenDecimals: 8,
            decimals: 18,
        },
        CAKE: {
            vTokenAddress: "0x86aC3974e2BD0d60825230fa6F355fF11409df5c",
            vTokenDecimals: 8,
            decimals: 18,
        },
        DAI: {
            vTokenAddress: "0x334b3eCB4DCa3593BCCC3c7EBD1A1C1d1780FBF1",
            vTokenDecimals: 8,
            decimals: 18,
        },
        DOGE: {
            vTokenAddress: "0xec3422Ef92B2fb59e84c8B02Ba73F1fE84Ed8D71",
            vTokenDecimals: 8,
            decimals: 8,
        },
        DOT: {
            vTokenAddress: "0x1610bc33319e9398de5f57B33a5b184c806aD217",
            vTokenDecimals: 8,
            decimals: 18,
        },
        ETH: {
            vTokenAddress: "0xf508fCD89b8bd15579dc79A6827cB4686A3592c8",
            vTokenDecimals: 8,
            decimals: 18,
        },
        FDUSD: {
            vTokenAddress: "0xC4eF4229FEc74Ccfe17B2bdeF7715fAC740BA0ba",
            vTokenDecimals: 8,
            decimals: 18,
        },
        FIL: {
            vTokenAddress: "0xf91d58b5aE142DAcC749f58A49FCBac340Cb0343",
            vTokenDecimals: 8,
            decimals: 18,
        },
        LINK: {
            vTokenAddress: "0x650b940a1033B8A1b1873f78730FcFC73ec11f1f",
            vTokenDecimals: 8,
            decimals: 18,
        },
        LTC: {
            vTokenAddress: "0x57A5297F2cB2c0AaC9D554660acd6D385Ab50c6B",
            vTokenDecimals: 8,
            decimals: 18,
        },
        LUNA: {
            vTokenAddress: "0xb91A659E88B51474767CD97EF3196A3e7cEDD2c8",
            vTokenDecimals: 8,
            decimals: 6,
        },
        MATIC: {
            vTokenAddress: "0x5c9476FcD6a4F9a3654139721c949c2233bBbBc8",
            vTokenDecimals: 8,
            decimals: 18,
        },
        SXP: {
            vTokenAddress: "0x2fF3d0F6990a40261c66E1ff2017aCBc282EB6d0",
            vTokenDecimals: 8,
            decimals: 18,
        },
        SolvBTC: {
            vTokenAddress: "0xf841cb62c19fCd4fF5CD0AaB5939f3140BaaC3Ea",
            vTokenDecimals: 8,
            decimals: 18,
        },
        TRX: {
            vTokenAddress: "0xC5D3466aA484B040eE977073fcF337f2c00071c1",
            vTokenDecimals: 8,
            decimals: 6,
        },
        TRXOLD: {
            vTokenAddress: "0x61eDcFe8Dd6bA3c891CB9bEc2dc7657B3B422E93",
            vTokenDecimals: 8,
            decimals: 18,
        },
        TUSD: {
            vTokenAddress: "0xBf762cd5991cA1DCdDaC9ae5C638F5B5Dc3Bee6E",
            vTokenDecimals: 8,
            decimals: 18,
        },
        TUSDOLD: {
            vTokenAddress: "0x08CEB3F4a7ed3500cA0982bcd0FC7816688084c3",
            vTokenDecimals: 8,
            decimals: 18,
        },
        TWT: {
            vTokenAddress: "0x4d41a36D04D97785bcEA57b057C412b278e6Edcc",
            vTokenDecimals: 8,
            decimals: 18,
        },
        UNI: {
            vTokenAddress: "0x27FF564707786720C71A2e5c1490A63266683612",
            vTokenDecimals: 8,
            decimals: 18,
        },
        USDC: {
            vTokenAddress: "0xecA88125a5ADbe82614ffC12D0DB554E2e2867C8",
            vTokenDecimals: 8,
            decimals: 18,
        },
        USDT: {
            vTokenAddress: "0xfD5840Cd36d94D7229439859C0112a4185BC0255",
            vTokenDecimals: 8,
            decimals: 18,
        },
        UST: {
            vTokenAddress: "0x78366446547D062f45b4C0f320cDaa6d710D87bb",
            vTokenDecimals: 8,
            decimals: 6,
        },
        WBETH: {
            vTokenAddress: "0x6CFdEc747f37DAf3b87a35a1D9c8AD3063A1A8A0",
            vTokenDecimals: 8,
            decimals: 18,
        },
        XRP: {
            vTokenAddress: "0xB248a295732e0225acd3337607cc01068e3b9c10",
            vTokenDecimals: 8,
            decimals: 18,
        },
        XVS: {
            vTokenAddress: "0x151B1e2635A717bcDc836ECd6FbB62B674FE3E1D",
            vTokenDecimals: 8,
            decimals: 18,
        },
        SOL: {
            vTokenAddress: "0xBf515bA4D1b52FFdCeaBF20d31D705Ce789F2cEC",
            vTokenDecimals: 8,
            decimals: 18,
        },
        THE: {
            vTokenAddress: "0x86e06EAfa6A1eA631Eab51DE500E3D474933739f",
            vTokenDecimals: 8,
            decimals: 18,
        },
        // Adding extra underlaying tokens and their details, wont be used
        // VAI: {
        //     vTokenAddress: "",
        //     vTokenDecimals: 0,
        //     decimals: 18,
        // },
        // VRT: {
        //     vTokenAddress: "",
        //     vTokenDecimals: 0,
        //     decimals: 18,
        // },
    },
    [ChainId.ETHEREUM]: {
        BAL: {
            vTokenAddress: "0x0Ec5488e4F8f319213a14cab188E01fB8517Faa8",
            vTokenDecimals: 8,
            decimals: 18,
        },
        crvUSD: {
            vTokenAddress: "0x672208C10aaAA2F9A6719F449C4C8227bc0BC202",
            vTokenDecimals: 8,
            decimals: 18,
        },
        DAI: {
            vTokenAddress: "0xd8AdD9B41D4E1cd64Edad8722AB0bA8D35536657",
            vTokenDecimals: 8,
            decimals: 18,
        },
        eBTC: {
            vTokenAddress: "0x325cEB02fe1C2fF816A83a5770eA0E88e2faEcF2",
            vTokenDecimals: 8,
            decimals: 8,
        },
        EIGEN: {
            vTokenAddress: "0x256AdDBe0a387c98f487e44b85c29eb983413c5e",
            vTokenDecimals: 8,
            decimals: 18,
        },
        FRAX: {
            vTokenAddress: "0x4fAfbDc4F2a9876Bd1764827b26fb8dc4FD1dB95",
            vTokenDecimals: 8,
            decimals: 18,
        },
        LBTC: {
            vTokenAddress: "0x25C20e6e110A1cE3FEbaCC8b7E48368c7b2F0C91",
            vTokenDecimals: 8,
            decimals: 8,
        },
        sFRAX: {
            vTokenAddress: "0x17142a05fe678e9584FA1d88EfAC1bF181bF7ABe",
            vTokenDecimals: 8,
            decimals: 18,
        },
        SUSDS: {
            vTokenAddress: "0xE36Ae842DbbD7aE372ebA02C8239cd431cC063d6",
            vTokenDecimals: 8,
            decimals: 18,
        },
        TUSD: {
            vTokenAddress: "0x13eB80FDBe5C5f4a7039728E258A6f05fb3B912b",
            vTokenDecimals: 8,
            decimals: 18,
        },
        USDC: {
            vTokenAddress: "0x17C07e0c232f2f80DfDbd7a95b942D893A4C5ACb",
            vTokenDecimals: 8,
            decimals: 6,
        },
        USDS: {
            vTokenAddress: "0x0c6B19287999f1e31a5c0a44393b24B62D2C0468",
            vTokenDecimals: 8,
            decimals: 18,
        },
        USDT: {
            vTokenAddress: "0x8C3e3821259B82fFb32B2450A95d2dcbf161C24E",
            vTokenDecimals: 8,
            decimals: 6,
        },
        WBTC: {
            vTokenAddress: "0x8716554364f20BCA783cb2BAA744d39361fd1D8d",
            vTokenDecimals: 8,
            decimals: 8,
        },
        WETH: {
            vTokenAddress: "0x7c8ff7d2A1372433726f879BD945fFb250B94c65",
            vTokenDecimals: 8,
            decimals: 18,
        },
    },
    [ChainId.BASE]: {
        USDC: {
            vTokenAddress: "0x3cb752d175740043Ec463673094e06ACDa2F9a2e",
            vTokenDecimals: 8,
            decimals: 6,
        },
        cbBTC: {
            vTokenAddress: "0x7bBd1005bB24Ec84705b04e1f2DfcCad533b6D72",
            vTokenDecimals: 8,
            decimals: 8,
        },
        WETH: {
            vTokenAddress: "0xEB8A79bD44cF4500943bf94a2b4434c95C008599",
            vTokenDecimals: 8,
            decimals: 18,
        },
        wsuperOETHb: {
            vTokenAddress: "0x75201D81B3B0b9D17b179118837Be37f64fc4930",
            vTokenDecimals: 8,
            decimals: 18,
        }
    }
}

export const BLOCKS_PER_YEAR = {
    [ChainId.BSC]: BigInt(10512000),
    [ChainId.ETHEREUM]: BigInt(2628000),
    [ChainId.BASE]: BigInt(15768000),
};


export const POOLS: Pool = {
    CORE: {
        poolAddress: '0xfD36E2c2a6789Db23113685031d7F16329158384',
        poolTokens: CORE_POOL_MARKET_TOKENS,
    },
    DEFI: {
        poolAddress: '0x3344417c9360b963ca93A4e8305361AEde340Ab9',
        poolTokens: DEFI_POOL_MARKET_TOKENS,
    },
};
