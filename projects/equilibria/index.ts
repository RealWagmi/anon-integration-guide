import { AdapterExport } from '@heyanon/sdk';
import { tools } from './tools';
import * as functions from './functions';

export default {
    tools,
    functions,
    description: 'Equilibria - A yield optimization platform for Pendle LP tokens, offering automated strategies and enhanced rewards across multiple chains',
} satisfies AdapterExport;
