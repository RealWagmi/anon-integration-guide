import { ChainId } from '@heyanon/sdk';
import { Percent, Token } from '@uniswap/sdk-core';
import type { Address } from 'viem';

export const SUPPORTED_CHAINS = [ChainId.SONIC];

export const SUBGRAPH_API_URL =
    'https://sonic.kingdomsubgraph.com/subgraphs/name/shadow-core';

export const SUBGRAPH_DOCS_PER_PAGE = 1000;

export const CL_POOL_INIT_CODE_HASH =
    '0xc701ee63862761c31d620a4a083c61bdc1e81761e6b9c9267fd19afd22e0821d';

export const NFP_MANAGER_ADDRESS: Address = '0x12E66C8F215DdD5d48d150c8f46aD0c6fB0F4406';

export const POOL_DEPLOYER_ADDRESS: Address =
    '0x8BBDc15759a8eCf99A92E004E0C64ea9A5142d59';

export const WRAPPED_NATIVE_ADDRESS: Address =
    '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38';

export const WRAPPED_NATIVE = new Token(
    ChainId.SONIC,
    WRAPPED_NATIVE_ADDRESS,
    18,
    'wS',
    'Wrapped Sonic',
);

export const SLIPPAGE_PRECISION = 1e9;

export const DEFAULT_LIQUIDITY_SLIPPAGE = new Percent(1, 100); // 1%
