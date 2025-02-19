import { AdapterExport } from '@heyanon/sdk';
import { tools } from './tools';
import * as functions from './functions';

export default {
    tools,
    functions,
    description: 'Rings is a meta-assets for USD, ETH & BTC offering competitive yield for stakers, providing deep liquidity for Sonic DeFi, and funding Sonic DeFi projects via its lockers.',
} satisfies AdapterExport;
