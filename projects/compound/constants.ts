import { ChainId } from '@heyanon/sdk';

export const supportedChains = [ChainId.ETHEREUM, ChainId.ARBITRUM, ChainId.BASE, ChainId.OPTIMISM, ChainId.POLYGON, ChainId.SCROLL];

// lending markets and base assets, addresses can be verified at https://docs.compound.finance/
export const comets: { [chainId: string]: { [token: string]: { address: `0x${string}`; supportedCollateral: string[] } } } = {
    [ChainId.ETHEREUM]: {
        USDC: {
            address: '0xc3d688B66703497DAA19211EEdff47f25384cdc3',
            supportedCollateral: ['USDC', 'cbBTC', 'COMP', 'LINK', 'tBTC', 'UNI', 'WBTC', 'WETH', 'wstETH'],
        },
        WETH: {
            address: '0xA17581A9E3356d9A858b789D68B4d866e593aE94',
            supportedCollateral: ['cbBTC', 'cbETH', 'COMP', 'ezETH', 'osETH', 'rETH', 'rsETH', 'rswETH', 'tBTC', 'WBTC', 'weETH', 'WETH', 'wstETH', 'ETHx'],
        },
        USDT: {
            address: '0x3Afdc9BCA9213A35503b077a6072F3D0d5AB0840',
            supportedCollateral: ['cbBTC', 'COMP', 'LINK', 'tBTC', 'UNI', 'USDT', 'WBTC', 'WETH', 'wstETH', 'wUSDM', 'sFRAX'],
        },
        wstETH: {
            address: '0x3D0bb1ccaB520A66e607822fC55BC921738fAFE3',
            supportedCollateral: ['COMP', 'wstETH', 'rsETH', 'ezETH'],
        },
        USDS: {
            address: '0x5D409e56D886231aDAf00c8775665AD0f9897b56',
            supportedCollateral: ['USDS', 'WETH', 'USDe', 'cbBTC', 'tBTC', 'wstETH', 'sUSDS', 'COMP'],
        },
    },
    [ChainId.ARBITRUM]: {
        'USDC.e': {
            address: '0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA',
            supportedCollateral: ['ARB', 'COMP', 'GMX', 'USDC.e', 'WBTC', 'WETH'],
        },
        USDC: {
            address: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf',
            supportedCollateral: ['ARB', 'COMP', 'GMX', 'USDC', 'WBTC', 'ezETH', 'WETH'],
        },
        WETH: {
            address: '0x6f7D514bbD4aFf3BcD1140B7344b32f063dEe486',
            supportedCollateral: ['COMP', 'rETH', 'wstETH', 'WBTC', 'ezETH', 'rsETH', 'USDT', 'USDC', 'WETH'],
        },
        USDT: {
            address: '0xd98Be00b5D27fc98112BdE293e487f8D4cA57d07',
            supportedCollateral: ['COMP', 'ARB', 'WETH', 'wstETH', 'WBTC', 'GMX', 'USDT'],
        },
    },
    [ChainId.BASE]: {
        USDC: {
            address: '0xb125E6687d4313864e53df431d5425969c15Eb2F',
            supportedCollateral: ['USDC', 'cbBTC', 'cbETH', 'COMP', 'WETH', 'wstETH'],
        },
        USDbC: {
            address: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf',
            supportedCollateral: ['USDbC', 'cbETH', 'COMP', 'WETH'],
        },
        WETH: {
            address: '0x46e6b214b524310239732D51387075E0e70970bf',
            supportedCollateral: ['cbBTC', 'cbETH', 'COMP', 'ezETH', 'USDC', 'weETH', 'WETH', 'wrsETH', 'wstETH'],
        },
        AERO: {
            address: '0x784efeB622244d2348d4F2522f8860B96fbEcE89',
            supportedCollateral: ['AERO', 'WETH', 'USDC', 'wstETH', 'cbBTC', 'COMP'],
        },
    },
    [ChainId.OPTIMISM]: {
        USDC: {
            address: '0x2e44e174f7D53F0212823acC11C01A11d58c5bCB',
            supportedCollateral: ['OP', 'WETH', 'WBTC', 'wstETH', 'COMP', 'wUSDM', 'USDC'],
        },
        USDT: {
            address: '0x995E394b8B2437aC8Ce61Ee0bC610D617962B214',
            supportedCollateral: ['COMP', 'OP', 'WETH', 'WBTC', 'wstETH', 'wUSDM', 'USDT'],
        },
        WETH: {
            address: '0xE36A30D249f7761327fd973001A32010b521b6Fd',
            supportedCollateral: ['COMP', 'ezETH', 'rETH', 'USDC', 'USDT', 'WBTC', 'weETH', 'WETH', 'wrsETH', 'wstETH'],
        },
    },
    [ChainId.POLYGON]: {
        USDC: {
            address: '0xF25212E676D1F7F89Cd72fFEe66158f541246445',
            supportedCollateral: ['MaticX', 'stMATIC', 'USDC', 'WBTC', 'WETH', 'WMATIC'],
        },
        USDT: {
            address: '0xaeB318360f27748Acb200CE616E389A6C9409a07',
            supportedCollateral: ['COMP', 'WMATIC', 'WETH', 'MaticX', 'stMATIC', 'WBTC', 'USDT'],
        },
    },
    [ChainId.SCROLL]: {
        USDC: {
            address: '0xB2f97c1Bd3bf02f5e74d13f02E3e26F93D77CE44',
            supportedCollateral: ['COMP', 'USDC', 'wstETH', 'WETH'],
        },
    },
} as const;

// collateral assets, addresses can be verified at https://docs.compound.finance/
export const collateralAssets: { [chainId: string]: { [token: string]: `0x${string}` } } = {
    [ChainId.ETHEREUM]: {
        USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        cbBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
        COMP: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
        LINK: '0x514910771af9ca656af840dff83e8264ecf986ca',
        tBTC: '0x18084fbA666a33d37592fA2633fD49a74DD93a88',
        UNI: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
        WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        wstETH: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
        cbETH: '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704',
        ezETH: '0xbf5495Efe5DB9ce00f80364C8B423567e58d2110',
        osETH: '0xf1C9acDc66974dFB6dEcB12aA385b9cD01190E38',
        rETH: '0xae78736Cd615f374D3085123A210448E74Fc6393',
        rsETH: '0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7',
        rswETH: '0xFAe103DC9cf190eD75350761e95403b7b8aFa6c0',
        weETH: '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee',
        ETHx: '0xA35b1B31Ce002FBF2058D22F30f95D405200A15b',
        wUSDM: '0x57F5E098CaD7A3D1Eed53991D4d66C45C9AF7812',
        sFRAX: '0xA663B02CF0a4b149d2aD41910CB81e23e1c41c32',
        USDS: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
        sUSDS: '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD',
    },
    [ChainId.ARBITRUM]: {
        ARB: '0x912ce59144191c1204e64559fe8253a0e49e6548',
        COMP: '0x354A6dA3fcde098F8389cad84b0182725c6C91dE',
        GMX: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a',
        'USDC.e': '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        WBTC: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
        WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        ezETH: '0x2416092f143378750bb29b79eD961ab195CcEea5',
        rETH: '0xEC70Dcb4A1EFa46b8F2D97C310C9c4790ba5ffA8',
        wstETH: '0x5979D7b546E38E414F7E9822514be443A4800529',
        rsETH: '0x4186BFC76E2E237523CBC30FD220FE055156b41F',
        USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    },
    [ChainId.BASE]: {
        USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        cbETH: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
        COMP: '0x9e1028F5F1D5eDE59748FFceE5532509976840E0',
        WETH: '0x4200000000000000000000000000000000000006',
        wstETH: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
        USDbC: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
        cbBTC: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
        ezETH: '0x2416092f143378750bb29b79eD961ab195CcEea5',
        weETH: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A',
        wrsETH: '0xEDfa23602D0EC14714057867A78d01e94176BEA0',
        AERO: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
    },
    [ChainId.OPTIMISM]: {
        OP: '0x4200000000000000000000000000000000000042',
        WETH: '0x4200000000000000000000000000000000000006',
        WBTC: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
        wstETH: '0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb',
        COMP: '0x7e7d4467112689329f7E06571eD0E8CbAd4910eE',
        wUSDM: '0x57f5e098cad7a3d1eed53991d4d66c45c9af7812',
        USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
        ezETH: '0x2416092f143378750bb29b79eD961ab195CcEea5',
        rETH: '0x9Bcef72be871e61ED4fBbc7630889beE758eb81D',
        weETH: '0x346e03F8Cce9fE01dCB3d0Da3e9D00dC2c0E08f0',
        wrsETH: '0x87eee96d50fb761ad85b1c982d28a042169d61b1',
    },
    [ChainId.POLYGON]: {
        MaticX: '0xfa68FB4628DFF1028CFEc22b4162FCcd0d45efb6',
        stMATIC: '0x3A58a54C066FdC0f2D55FC9C89F0415C92eBf3C4',
        USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        WBTC: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
        WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
        COMP: '0x8505b9d2254A7Ae468c0E9dd10Ccea3A837aef5c',
        USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    },
    [ChainId.SCROLL]: {
        COMP: '0x643e160a3C3E2B7eae198f0beB1BfD2441450e86',
        USDC: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4',
        wstETH: '0xf610A9dfB7C89644979b4A0f27063E9e7d7Cda32',
        WETH: '0x5300000000000000000000000000000000000004',
    },
} as const;

// enum of all lending markets
export const cometsEnum = [
    ...new Set([
        ...Object.keys(comets[ChainId.ETHEREUM]),
        ...Object.keys(comets[ChainId.ARBITRUM]),
        ...Object.keys(comets[ChainId.BASE]),
        ...Object.keys(comets[ChainId.OPTIMISM]),
        ...Object.keys(comets[ChainId.POLYGON]),
        ...Object.keys(comets[ChainId.SCROLL]),
    ]),
];

// enum of all collateral assets
export const collateralAssetsEnum = [
    ...new Set([
        ...Object.keys(collateralAssets[ChainId.ETHEREUM]),
        ...Object.keys(collateralAssets[ChainId.ARBITRUM]),
        ...Object.keys(collateralAssets[ChainId.BASE]),
        ...Object.keys(collateralAssets[ChainId.OPTIMISM]),
        ...Object.keys(collateralAssets[ChainId.POLYGON]),
        ...Object.keys(collateralAssets[ChainId.SCROLL]),
    ]),
];
