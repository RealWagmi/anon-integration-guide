import { Address } from 'viem';
import 'dotenv/config';

import BigNumber from 'bignumber.js';

BigNumber.config({
    ROUNDING_MODE: BigNumber.ROUND_DOWN,
    DECIMAL_PLACES: 0,
});

enum VaultType {
    CONCENTRATED,
    STABLE,
    VOLATILE,
}

type IchiVault = {
    title: string;
    vault: Address;
    vaultType: VaultType;
    token0: TokenInfo;
    token1: TokenInfo;
    gauge: Address;
    isToken0Allowed: boolean;
    isToken1Allowed: boolean;
};

type TokenInfo = {
    address: Address;
    symbol: string;
    name: string;
    decimals: number;
};

export const WEEK_IN_SECONDS = 604800;

export const veSWPx = '0xAA30F0977620D4d46B3Bb3Cf0794Fe645d576CA3' as Address;

export const SONIC_TOKENS: Record<string, TokenInfo> = {
    WETH: {
        address: '0x50c42dEAcD8Fc9773493ED674b675bE577f2634b',
        symbol: 'WETH',
        name: 'Wrapped Ether on Sonic',
        decimals: 18,
    },
    WSONIC: {
        address: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38',
        symbol: 'wSONIC',
        name: 'Wrapped SONIC',
        decimals: 18,
    },
    SWPx: {
        address: '0xA04BC7140c26fc9BB1F36B1A604C7A5a88fb0E70',
        symbol: 'SWPx',
        name: 'SwapX',
        decimals: 18,
    },
};

export const veSWPxAddress = '0xAA30F0977620D4d46B3Bb3Cf0794Fe645d576CA3' as Address;

export const voterV3Address = '0xC1AE2779903cfB84CB9DEe5c03EcEAc32dc407F2' as Address;

export const rewardsDistributor = '0x1C236D74f61C6199e6D23201D53a59753f4c94D3';

export const ichiVaults: IchiVault[] = [
    {
        title: 'wS-WETH',
        vault: '0x0f5AcFC6D67410232589265a71E80661d0352848',
        vaultType: VaultType.CONCENTRATED,
        token0: SONIC_TOKENS.WSONIC,
        token1: SONIC_TOKENS.WETH,
        gauge: '0x',
        isToken0Allowed: true,
        isToken1Allowed: false,
    },
    {
        title: 'wS-SWPx',
        vault: '0xfDEc32751Faade573B285C8CC606677beE656A4C',
        vaultType: VaultType.CONCENTRATED,
        token0: SONIC_TOKENS.WSONIC,
        token1: SONIC_TOKENS.SWPx,
        gauge: '0x701A6eB7879B9da39662950DCCAfC5C81e0b60B0',
        isToken0Allowed: true,
        isToken1Allowed: false,
    },
];
