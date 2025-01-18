import { ChainId } from '@heyanon/sdk';
import { Address } from 'viem';

export const SUPPORTED_CHAINS = [ChainId.ARBITRUM];

export const GRAPH_API_KEY = '939d894fb6b87b1222a450d9aad926f8';
export const GRAPH_URLS: Record<number, string> = {
    [ChainId.ARBITRUM]: `https://gateway.thegraph.com/api/${GRAPH_API_KEY}/subgraphs/id/3utanEBA9nqMjPnuQP1vMCCys6enSM3EawBpKTVwnUw2`,
};

export const PERCENTAGE_BASE = 100n;
export const MIN_TICK = -887272;
export const MAX_TICK = 887272;
export const MAX_UINT128 = 2n ** 128n - 1n;

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;
export const ADDRESSES: Record<number, { ALGEBRA_FACTORY_ADDRESS: Address; QUOTER_ADDRESS: Address; SWAP_ROUTER_ADDRESS: Address; NONFUNGIBLE_POSITION_MANAGER_ADDRESS: Address }> =
    {
        [ChainId.ARBITRUM]: {
            ALGEBRA_FACTORY_ADDRESS: '0x1a3c9B1d2F0529D97f2afC5136Cc23e58f1FD35B' as Address,
            QUOTER_ADDRESS: '0x0Fc73040b26E9bC8514fA028D998E73A254Fa76E' as Address,
            SWAP_ROUTER_ADDRESS: '0x1F721E2E82F6676FCE4eA07A5958cF098D339e18' as Address,
            NONFUNGIBLE_POSITION_MANAGER_ADDRESS: '0x00c7f3082833e796A5b3e4Bd59f6642FF44DCD15' as Address,
        },
    };
