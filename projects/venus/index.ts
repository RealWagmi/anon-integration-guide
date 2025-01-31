import { AdapterExport } from '@heyanon/sdk';
import { tools } from './tools';
import * as functions from './functions';

export default {
    tools,
    functions,
    description:
        'Venus is a decentralized protocol providing ability to supply/borrow/withdraw multiple tokens.',
} satisfies AdapterExport;