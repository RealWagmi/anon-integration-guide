import { AdapterExport } from '@heyanon/sdk';
import { tools } from './tools';
import * as functions from './functions';

const adapter: AdapterExport = {
    tools,
    functions,
    description: 'Integration with Pendle Finance v2 Protocol - Liquid staking derivatives and yield trading'
};

export default adapter;

// Re-export functions for direct access
export * from './functions';
export * from './types';
