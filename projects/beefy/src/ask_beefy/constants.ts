import { EVM } from '@heyanon/sdk';

const { ChainIds } = EVM.constants;

/**
 * Array of tokens that ask_beefy will be able to find
 * by symbol
 */
export const TOKENS = {
    [ChainIds.sonic]: [
        {
            symbol: 'wS',
            address: '0x039e2fb66102314ce7b64ce5ce3e5183bc94ad38',
            decimals: 18,
        },
        {
            symbol: 'stS',
            address: '0xe5da20f15420ad15de0fa650600afc998bbe3955',
            decimals: 18,
        },
        {
            symbol: 'USDC.e',
            address: '0x29219dd400f2bf60e5a23d13be72b486d4038894',
            decimals: 6,
        },
    ],
};
