import { AdapterExport } from '@heyanon/sdk'';
import { tools } from './tools';
import * as functions from './functions';

export default {
    tools,
    functions,
    description: 'Yelay automatically reallocates user's liquidity among bluechip DeFi protocols in order to farm best yield',
} satisfies AdapterExport;
