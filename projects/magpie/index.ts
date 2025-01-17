import { AdapterExport } from '@heyanon/sdk';
import { tools } from './tools';
import * as functions from './functions';

export default {
    tools,
    functions,
    description:
        'Magpie Protocol is an execution engine for traders, agents, and dapps that aggregates DEXS, DeFi protocols while providing provably better pricing compared to leading aggregators. It provides users with the best deals on any assets across top chains.',
} satisfies AdapterExport;
