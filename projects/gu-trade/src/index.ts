import { AdapterExport } from '@heyanon/sdk';
import { tools } from './tools';
import * as functions from './functions';

export default {
    tools,
    functions,
    description: 'Gu Trade is the ultimate protocol to launch and trade your tokens and memecoins, built on top of CamelotDEX.',
} satisfies AdapterExport;
