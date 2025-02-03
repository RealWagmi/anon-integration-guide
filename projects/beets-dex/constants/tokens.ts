import { Address } from 'viem';

export interface WhitelistedToken {
    symbol: string;
    address: Address;
    name: string;
}

export const WHITELISTED_TOKENS: { [chainId: string]: WhitelistedToken[] } = {
    'SONIC': [
        // Using wS address for native Sonic token
        {
            symbol: 'S',
            address: '0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38',
            name: 'Sonic',
        },
        {
            symbol: 'Sonic',
            address: '0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38',
            name: 'Sonic',
        },
        {
            symbol: 'wS',
            address: '0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38',
            name: 'Wrapped Sonic',
        },
        {
            symbol: 'stS',
            address: '0xe5da20f15420ad15de0fa650600afc998bbe3955',
            name: 'Beets Staked Sonic',
        },
        {
            symbol: 'ETH',
            address: '0x50c42dEAcD8Fc9773493ED674b675bE577f2634b',
            name: 'Ether',
        },
        {
            symbol: 'wETH',
            address: '0x50c42dEAcD8Fc9773493ED674b675bE577f2634b',
            name: 'Wrapped Ether',
        },
        {
            symbol: 'scETH',
            address: '0x3bce5cb273f0f148010bbea2470e7b5df84c7812',
            name: 'Sonic Rings Ether',
        },
        {
            symbol: 'BEETS',
            address: '0x2d0e0814e62d80056181f5cd932274405966e4f0',
            name: 'Beets token',
        },
        // STABLECOINS
        {
            symbol: 'USDC.e',
            address: '0x29219dd400f2bf60e5a23d13be72b486d4038894',
            name: 'Bridged USD Circle Coin',
        },
        // Native USDC not available on sonic, will use bridged USDC.e
        {
            symbol: 'USDC',
            address: '0x29219dd400f2bf60e5a23d13be72b486d4038894',
            name: 'Bridged USD Circle Coin',
        },
        {
            symbol: 'EURC',
            address: '0xe715cba7b5ccb33790cebff1436809d36cb17e57',
            name: 'Bridged EUR Circle Coin',
        },
        {
            symbol: 'scUSD',
            address: '0xd3dce716f3ef535c5ff8d041c1a41c3bd89b97ae',
            name: 'Sonic USD Rings Coin',
        },
    ],
}; 