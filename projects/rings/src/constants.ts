import { Chain, EVM } from '@heyanon/sdk';
import { Address } from 'viem';

const { ChainIds } = EVM.constants;

export const supportedChains = [ChainIds[Chain.BSC]];

interface AssetConfig {
    address: Address,
    decimals: number,
    teller?: Address,
    withdraw?: Address
}

export const TOKEN: Record<string, Record<string, AssetConfig>> = {
    ETH: {
        SCETH: {
            address: '0x3bcE5CB273F0F148010BbEa2470e7b5df84C7812',
            decimals: 18,
            teller: '0x31A5A9F60Dc3d62fa5168352CaF0Ee05aA18f5B8',
            withdraw: '0x555f4dF2180df6257860F23b29d653c1AAFb7957',
        },
        STKSCETH: {
            address: '0x455d5f11Fea33A8fa9D3e285930b478B6bF85265',
            decimals: 18,
            teller: '0x49AcEbF8f0f79e1Ecb0fd47D684DAdec81cc6562',
            withdraw: '0x65b6AFB8C1521B48488dF04224Dc019Ea390E133',
        },
        VEETH: {
            address: '0x1Ec2b9a77A7226ACD457954820197F89B3E3a578',
            decimals: 18,
        },
        WETH: {
            address: '0x50c42dEAcD8Fc9773493ED674b675bE577f2634b',
            decimals: 18,
        }
    },
    USD: {
        SCUSD: {
            address: '0xd3DCe716f3eF535C5Ff8d041c1A41C3bd89b97aE',
            decimals: 6,
            teller: '0x358CFACf00d0B4634849821BB3d1965b472c776a',
            withdraw: '0x3754480db8b3E607fbE125697EB496a44A1Be720',
        },
        STKSCUSD: {
            address: '0x4D85bA8c3918359c78Ed09581E5bc7578ba932ba',
            decimals: 6,
            teller: '0x5e39021Ae7D3f6267dc7995BB5Dd15669060DAe0',
            withdraw: '0x5448A65ddB14e6F273cd0eD6598805105A39d8cC',
        },
        VEUSD: {
            address: '0x0966CAE7338518961c2d35493D3EB481A75bb86B',
            decimals: 6,
        },
        USDC: {
            address: '0x29219dd400f2Bf60E5a23d13Be72B486D4038894',
            decimals: 6,
        },
    },
    BTC: {
        SCBTC: {
            address: '0xBb30e76d9Bb2CC9631F7fC5Eb8e87B5Aff32bFbd',
            decimals: 8,
            teller: '0xAce7DEFe3b94554f0704d8d00F69F273A0cFf079',
            withdraw: '0x488000E6a0CfC32DCB3f37115e759aF50F55b48B',
        },
        STKSCBTC: {
            address: '0xD0851030C94433C261B405fEcbf1DEC5E15948d0',
            decimals: 8,
            teller: '0x825254012306bB410b550631895fe58DdCE1f4a9',
            withdraw: '0x6dF97Ed8B28d9528cd34335c0a151F10E48b6eF3',
        },
        VEBTC: {
            address: '0x7585D9C32Db1528cEAE4770Fd1d01B888F5afA9e',
            decimals: 8,
        },
        WBTC: {
            address: '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c',
            decimals: 8,
        },
    },
}


