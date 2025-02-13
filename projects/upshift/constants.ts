import { ChainId } from '@heyanon/sdk';
import { Address } from 'viem';

export const supportedChains = [ChainId.ETHEREUM, ChainId.BASE, ChainId.AVALANCHE];

export interface TokenConfig {
    name: string,
    address: Address,
    wrapped?: Address,
    decimals: number,
    vaultAddress: Address,
    vaultSymbol: string,
    vaultDecimals: number,
    stakeAddress?: Address,
    api: string
}

export const TOKEN = {
    [ChainId.ETHEREUM]: {
        LBTC: {
            name: 'Lombard',
            address: '0x8236a87084f8B84306f72007F36F2618A5634494',
            decimals: 8,
            vaultAddress: '0x18a5a3D575F34e5eBa92ac99B0976dBe26f9F869',
            vaultSymbol: 'upLBTC',
            vaultDecimals: 8,
            api: 'lombard'
        },
        WETH: {
            name: 'Treehouse',
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            decimals: 18,
            vaultAddress: '0x5Fde59415625401278c4d41C6beFCe3790eb357f',
            vaultSymbol: 'gtETH',
            vaultDecimals: 18,
            api: 'treehouse'
        },
        WSTETH: {
            name: 'Treehouse',
            address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
            decimals: 18,
            vaultAddress: '0x5Fde59415625401278c4d41C6beFCe3790eb357f',
            vaultSymbol: 'gtETH',
            vaultDecimals: 18,
            api: 'treehouse'
        },
        ETH: {
            name: 'Treehouse',
            address: '',
            wrapped: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            decimals: 18,
            vaultAddress: '0x5Fde59415625401278c4d41C6beFCe3790eb357f',
            vaultSymbol: 'gtETH',
            vaultDecimals: 18,
            api: 'treehouse'
        },
        SUSDE: {
            name: 'Ethena',
            address: '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497',
            decimals: 18,
            vaultAddress: '0xd684AF965b1c17D628ee0d77cae94259c41260F4',
            vaultSymbol: 'upsUSDe',
            vaultDecimals: 18,
            api: 'ethena'
        }
    },
    [ChainId.BASE]: {
        LBTC: {
            name: 'Lombard',
            address: '0xecAc9C5F704e954931349Da37F60E39f515c11c1',
            decimals: 8,
            vaultAddress: '0x4e2D90f0307A93b54ACA31dc606F93FE6b9132d2',
            vaultSymbol: 'upLBTC',
            vaultDecimals: 8,
            api: 'lombard'
        }
    },
    [ChainId.AVALANCHE]: {
        AVAX: {
            name: 'Avalanche',
            address: '',
            wrapped: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
            decimals: 18,
            vaultAddress: '0xB2bFb52cfc40584AC4e9e2B36a5B8d6554A56e0b',
            vaultSymbol: 'upAVAX',
            vaultDecimals: 18,
            stakeAddress: '0xd3e653A9f6F3d96B26Dd4487a53D151140B697C4',
            api: 'avax'
        },
        WAVAX: {
            name: 'Avalanche',
            address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
            decimals: 18,
            vaultAddress: '0xB2bFb52cfc40584AC4e9e2B36a5B8d6554A56e0b',
            vaultSymbol: 'upAVAX',
            vaultDecimals: 18,
            stakeAddress: '0xd3e653A9f6F3d96B26Dd4487a53D151140B697C4',
            api: 'avax'
        },
        AUSD: {
            name: 'Avalanche',
            address: '0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a',
            decimals: 6,
            vaultAddress: '0x3408b22d8895753C9A3e14e4222E981d4E9A599E',
            vaultSymbol: 'upAUSD',
            vaultDecimals: 6,
            stakeAddress: '0xAeAc5f82B140c0f7309f7E9Ec43019062A5e5BE2',
            api: 'avax'
        }
    }
}