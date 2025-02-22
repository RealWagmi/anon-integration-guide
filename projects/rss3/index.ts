import type { AdapterExport } from '@heyanon/sdk';
import { tools } from './tools';
import * as functions from './functions';

export default {
    tools,
    functions,
    description: 'Access data specifically structured for AI Agents.',
} satisfies AdapterExport;
