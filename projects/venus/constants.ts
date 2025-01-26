import { ChainId } from '@heyanon/sdk';
import {Address} from "viem";

export const supportedChains = [ChainId.BSC];

export const supportedPools = ['CORE', 'DEFI'];

export const VTOKEN_ADDRESS = '0xefdf5ccc12d8cff4a7ed4e421b95f8f69cf2f766'
export const VBNB_ADDRESS = '0xa07c5b74c9b40447a954e1466938b865b6bbea36'
export const VDISTRIBUTION_ADDRESS = '0xfD36E2c2a6789Db23113685031d7F16329158384'


export const VTOKEN_DECIMALS = 18


interface Token {
    address: Address;
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

export const DEFI_POOL_MARKET_TOKENS: TokenConfig= {
    [ChainId.BSC] : {
        BNB: {
            address: "0xA07c5b74C9B40447a954e1466938b865b6BBea36",
            decimals: 18,
            chainBased: true,
        },
    }
}


export const CORE_POOL_MARKET_TOKENS: TokenConfig = {
    [ChainId.BSC] : {
        AAVE: {
            address: "0x26DA28954763B92139ED49283625ceCAf52C6f94",
            decimals: 18,
        },
        ADA: {
            address: "0x9A0AF7FDb2065Ce470D72664DE73cAE409dA28Ec",
            decimals: 18,
        },
        BCH: {
            address: "0x5F0388EBc2B94FA8E123F404b79cCF5f40b29176",
            decimals: 8,
        },
        BETH: {
            address: "0x972207A639CC1B374B893cc33Fa251b55CEB7c07",
            decimals: 18,
        },
        BNB: {
            address: "0xA07c5b74C9B40447a954e1466938b865b6BBea36",
            decimals: 18,
            chainBased: true,
        },
        BTC: {
            address: "0x882C173bC7Ff3b7786CA16dfeD3DFFfb9Ee7847B",
            decimals: 8,
        },
        BUSD: {
            address: "0x95c78222B3D6e262426483D42CfA53685A67Ab9D",
            decimals: 18,
        },
        CAKE: {
            address: "0x86aC3974e2BD0d60825230fa6F355fF11409df5c",
            decimals: 18,
        },
        DAI: {
            address: "0x334b3eCB4DCa3593BCCC3c7EBD1A1C1d1780FBF1",
            decimals: 18,
        },
        DOGE: {
            address: "0xec3422Ef92B2fb59e84c8B02Ba73F1fE84Ed8D71",
            decimals: 8,
        },
        DOT: {
            address: "0x1610bc33319e9398de5f57B33a5b184c806aD217",
            decimals: 18,
        },
        ETH: {
            address: "0xf508fCD89b8bd15579dc79A6827cB4686A3592c8",
            decimals: 18,
        },
        FDUSD: {
            address: "0xC4eF4229FEc74Ccfe17B2bdeF7715fAC740BA0ba",
            decimals: 18,
        },
        FIL: {
            address: "0xf91d58b5aE142DAcC749f58A49FCBac340Cb0343",
            decimals: 18,
        },
        LINK: {
            address: "0x650b940a1033B8A1b1873f78730FcFC73ec11f1f",
            decimals: 18,
        },
        LTC: {
            address: "0x57A5297F2cB2c0AaC9D554660acd6D385Ab50c6B",
            decimals: 18,
        },
        LUNA: {
            address: "0xb91A659E88B51474767CD97EF3196A3e7cEDD2c8",
            decimals: 18,
        },
        MATIC: {
            address: "0x5c9476FcD6a4F9a3654139721c949c2233bBbBc8",
            decimals: 18,
        },
        SXP: {
            address: "0x2fF3d0F6990a40261c66E1ff2017aCBc282EB6d0",
            decimals: 18,
        },
        SolvBTC: {
            address: "0xf841cb62c19fCd4fF5CD0AaB5939f3140BaaC3Ea",
            decimals: 8,
        },
        TRX: {
            address: "0xC5D3466aA484B040eE977073fcF337f2c00071c1",
            decimals: 18,
        },
        TRXOLD: {
            address: "0x61eDcFe8Dd6bA3c891CB9bEc2dc7657B3B422E93",
            decimals: 6,
        },
        TUSD: {
            address: "0xBf762cd5991cA1DCdDaC9ae5C638F5B5Dc3Bee6E",
            decimals: 18,
        },
        TUSDOLD: {
            address: "0x08CEB3F4a7ed3500cA0982bcd0FC7816688084c3",
            decimals: 18,
        },
        TWT: {
            address: "0x4d41a36D04D97785bcEA57b057C412b278e6Edcc",
            decimals: 18,
        },
        UNI: {
            address: "0x27FF564707786720C71A2e5c1490A63266683612",
            decimals: 18,
        },
        USDC: {
            address: "0xecA88125a5ADbe82614ffC12D0DB554E2e2867C8",
            decimals: 6,
        },
        USDT: {
            address: "0xfD5840Cd36d94D7229439859C0112a4185BC0255",
            decimals: 18,
        },
        UST: {
            address: "0x78366446547D062f45b4C0f320cDaa6d710D87bb",
            decimals: 18,
        },
        WBETH: {
            address: "0x6CFdEc747f37DAf3b87a35a1D9c8AD3063A1A8A0",
            decimals: 18,
        },
        XRP: {
            address: "0xB248a295732e0225acd3337607cc01068e3b9c10",
            decimals: 18,
        },
        XVS: {
            address: "0x151B1e2635A717bcDc836ECd6FbB62B674FE3E1D",
            decimals: 18,
        }
    },
    [ChainId.ETHEREUM]: {

    }
}


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
