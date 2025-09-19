import { AdapterExport, AdapterTag, Chain, EVM } from '@heyanon/sdk';
import { supportedChains } from './constants';
import * as functions from './functions';
import { tools } from './tools';

const { getChainName } = EVM.utils;

export default {
    tools,
    functions,
    description:
        'Pendle Finance: a yield-trading protocol that splits interest-bearing assets into Principal Tokens (PT) and Yield Tokens (YT). Portfolio: view positions, APY, TVL. Markets: find pools with the highest/best fixed yields. Mint/Redeem: create and redeem PTs and YTs. Swap: trade PTs and YTs, provide/remove liquidity. Rewards: show and claim rewards across chains.',
    tags: [AdapterTag.FARM],
    chains: supportedChains.map(getChainName) as Chain[],
    executableFunctions: ['getMyPositionsPortfolio', 'getAddressPositionsPortfolio'],
} satisfies AdapterExport;
