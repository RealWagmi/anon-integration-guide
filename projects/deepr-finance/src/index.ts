import { AdapterExport } from '@heyanon/sdk';
import { tools } from './tools';
import * as functions from './functions';

export default {
    tools,
    functions,
    description: 'Deepr Finance is a decentralized finance (DeFi) platform built on the IOTA EVM that enables users to lend and borrow digital assets.',
} satisfies AdapterExport;
