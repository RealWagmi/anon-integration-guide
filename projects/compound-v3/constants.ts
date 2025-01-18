import { ChainId, NATIVE_ADDRESS, WETH9 } from '@heyanon/sdk';
import { Address } from 'viem';

export const supportedChains = [ChainId.ETHEREUM, ChainId.ARBITRUM, ChainId.BASE];
export type SupprotedChainsType = ChainId.ETHEREUM | ChainId.ARBITRUM | ChainId.BASE;

export const SECONDS_PER_YEAR = 60 * 60 * 24 * 365;

export enum MarketBaseAssets {
    'USDC' = 'USDC',
    'USDC.e' = 'USDC.e',
    'USDbC' = 'USDbC',
    'WETH' = 'WETH',
    'AERO' = 'AERO',
    'USDT' = 'USDT',
    'USDS' = 'USDS',
    'wstETH' = 'wstETH',
}

export const nativeTokensAddress: { [chain in SupprotedChainsType]: Address } = {
    [ChainId.ETHEREUM]: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    [ChainId.ARBITRUM]: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    [ChainId.BASE]: '0x4200000000000000000000000000000000000006',
};

export type MarketConfig = {
    rewardsAddress: Address;
    bulkerAddress: Address;
    name: string;
    cometAddress: Address;
    baseAsset: MarketBaseAssets;
    baseAssetAddress: Address;
    baseAssetDecimals: number;
};

export const MARKETS: { [chain in SupprotedChainsType]: MarketConfig[] } = {
    [ChainId.ETHEREUM]: [
        {
            rewardsAddress: '0x1B0e765F6224C21223AeA2af16c1C46E38885a40',
            bulkerAddress: '0x74a81F84268744a40FEBc48f8b812a1f188D80C3',
            name: 'Compound USDC Ethereum',
            cometAddress: '0xc3d688B66703497DAA19211EEdff47f25384cdc3',
            baseAsset: MarketBaseAssets.USDC,
            baseAssetAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            baseAssetDecimals: 6,
        },
        {
            rewardsAddress: '0x1B0e765F6224C21223AeA2af16c1C46E38885a40',
            bulkerAddress: '0xa397a8C2086C554B531c02E29f3291c9704B00c7',
            name: 'Compound USDT Ethereum',
            cometAddress: '0x3Afdc9BCA9213A35503b077a6072F3D0d5AB0840',
            baseAsset: MarketBaseAssets.USDT,
            baseAssetAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            baseAssetDecimals: 6,
        },
        {
            rewardsAddress: '0x1B0e765F6224C21223AeA2af16c1C46E38885a40',
            bulkerAddress: '0xa397a8C2086C554B531c02E29f3291c9704B00c7',
            name: 'Compound USDS Ethereum',
            cometAddress: '0x5D409e56D886231aDAf00c8775665AD0f9897b56',
            baseAsset: MarketBaseAssets.USDS,
            baseAssetAddress: '0xdC035D45d973E3EC169d2276DDab16f1e407384F',
            baseAssetDecimals: 18,
        },
        {
            rewardsAddress: '0x1B0e765F6224C21223AeA2af16c1C46E38885a40',
            bulkerAddress: '0xa397a8C2086C554B531c02E29f3291c9704B00c7',
            name: 'Compound WETH Ethereum',
            cometAddress: '0xA17581A9E3356d9A858b789D68B4d866e593aE94',
            baseAsset: MarketBaseAssets.WETH,
            baseAssetAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            baseAssetDecimals: 18,
        },
        {
            rewardsAddress: '0x1B0e765F6224C21223AeA2af16c1C46E38885a40',
            bulkerAddress: '0x2c776041CCFe903071AF44aa147368a9c8EEA518',
            name: 'Compound wstETH Ethereum',
            cometAddress: '0x3D0bb1ccaB520A66e607822fC55BC921738fAFE3',
            baseAsset: MarketBaseAssets.wstETH,
            baseAssetAddress: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
            baseAssetDecimals: 18,
        },
    ],
    [ChainId.ARBITRUM]: [
        {
            rewardsAddress: '0x88730d254A2f7e6AC8388c3198aFd694bA9f7fae',
            bulkerAddress: '0xbdE8F31D2DdDA895264e27DD990faB3DC87b372d',
            name: 'Compound USDC.e Arbitrum',
            cometAddress: '0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA',
            baseAsset: MarketBaseAssets['USDC.e'],
            baseAssetAddress: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
            baseAssetDecimals: 6,
        },
        {
            rewardsAddress: '0x88730d254A2f7e6AC8388c3198aFd694bA9f7fae',
            bulkerAddress: '0xbdE8F31D2DdDA895264e27DD990faB3DC87b372d',
            name: 'Compound USDC Arbitrum',
            cometAddress: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf',
            baseAsset: MarketBaseAssets.USDC,
            baseAssetAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            baseAssetDecimals: 6,
        },
        {
            rewardsAddress: '0x88730d254A2f7e6AC8388c3198aFd694bA9f7fae',
            bulkerAddress: '0xbdE8F31D2DdDA895264e27DD990faB3DC87b372d',
            name: 'Compound WETH Arbitrum',
            cometAddress: '0x6f7D514bbD4aFf3BcD1140B7344b32f063dEe486',
            baseAsset: MarketBaseAssets.WETH,
            baseAssetAddress: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
            baseAssetDecimals: 18,
        },
        {
            rewardsAddress: '0x88730d254A2f7e6AC8388c3198aFd694bA9f7fae',
            bulkerAddress: '0xbdE8F31D2DdDA895264e27DD990faB3DC87b372d',
            name: 'Compound USDT Arbitrum',
            cometAddress: '0xd98Be00b5D27fc98112BdE293e487f8D4cA57d07',
            baseAsset: MarketBaseAssets.USDT,
            baseAssetAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
            baseAssetDecimals: 6,
        },
    ],
    [ChainId.BASE]: [
        {
            rewardsAddress: '0x123964802e6ABabBE1Bc9547D72Ef1B69B00A6b1',
            bulkerAddress: '0x78D0677032A35c63D142a48A2037048871212a8C',
            name: 'Compound USDC Base',
            cometAddress: '0xb125E6687d4313864e53df431d5425969c15Eb2F',
            baseAsset: MarketBaseAssets.USDC,
            baseAssetAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            baseAssetDecimals: 6,
        },
        {
            rewardsAddress: '0x123964802e6ABabBE1Bc9547D72Ef1B69B00A6b1',
            bulkerAddress: '0x78D0677032A35c63D142a48A2037048871212a8C',
            name: 'Compound USDbC Base',
            cometAddress: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf',
            baseAsset: MarketBaseAssets.USDbC,
            baseAssetAddress: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
            baseAssetDecimals: 6,
        },
        {
            rewardsAddress: '0x123964802e6ABabBE1Bc9547D72Ef1B69B00A6b1',
            bulkerAddress: '0x78D0677032A35c63D142a48A2037048871212a8C',
            name: 'Compound WETH Base',
            cometAddress: '0x46e6b214b524310239732D51387075E0e70970bf',
            baseAsset: MarketBaseAssets.WETH,
            baseAssetAddress: '0x4200000000000000000000000000000000000006',
            baseAssetDecimals: 18,
        },
        {
            rewardsAddress: '0x123964802e6ABabBE1Bc9547D72Ef1B69B00A6b1',
            bulkerAddress: '0x78D0677032A35c63D142a48A2037048871212a8C',
            name: 'Compound AERO Base',
            cometAddress: '0x784efeB622244d2348d4F2522f8860B96fbEcE89',
            baseAsset: MarketBaseAssets.AERO,
            baseAssetAddress: '0x940181a94A35A4569E4529A3CDfB74e38FD98631',
            baseAssetDecimals: 18,
        },
    ],
};

export const getMarketConfigByChainAndTokenAddress = (chainId: SupprotedChainsType, tokenAddress: Address): MarketConfig => {
    if (NATIVE_ADDRESS === tokenAddress) {
        return MARKETS[chainId].find((market) => market.baseAssetAddress === WETH9[chainId].address) as MarketConfig;
    }

    return MARKETS[chainId].find((market) => market.baseAssetAddress === tokenAddress) as MarketConfig;
};

export const getMarketConfigByChainAndMarketAddress = (chainId: SupprotedChainsType, marketAddress: Address): MarketConfig => {
    return MARKETS[chainId].find((market) => market.cometAddress.toUpperCase() === marketAddress.toUpperCase()) as MarketConfig;
};

export const isNativeToken = (tokenAddress: Address): boolean => {
    return tokenAddress === NATIVE_ADDRESS;
};

export const getWrappedNative = (chainId: Address): boolean => {
    return WETH9[chainId];
};

export const isUsdtOnEthereum = (chainId: ChainId, tokenAddress: Address): boolean => {
    return chainId === ChainId.ETHEREUM && tokenAddress.toUpperCase() === getMarketConfigByChainAndTokenAddress(chainId, tokenAddress).baseAssetAddress.toUpperCase();
};

export const getAllMarketsOnChain = (chainId: SupprotedChainsType): MarketConfig[] => {
    return MARKETS[chainId];
};
