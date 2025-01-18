import { AdapterExport } from '@heyanon/sdk';
import { tools } from './tools';
import * as functions from './functions';

export default {
    tools,
    functions,
    description: 'Compound V3 Protocol is a Tier-1 decentralized lending protocol with isolated markets allowing users to lend and borrow various assets.',
} satisfies AdapterExport;
