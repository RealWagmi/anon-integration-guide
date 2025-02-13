import { ChainId } from '@heyanon/sdk';

export const supportedChains = [ChainId.SONIC];

export const TOKEN = {
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
}


