import { AdapterExport } from '@heyanon/sdk';
import { tools } from './tools.js';
import * as functions from './functions';

export default {
    tools,
    functions,
    description: 'Shadow V3 Exchange',
} satisfies AdapterExport;
