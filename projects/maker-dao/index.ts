import { AdapterExport } from '@heyanon/sdk';
import { tools } from './tools';
import * as functions from './functions';

export default {
    tools,
    functions,
    description:
        'Maker DAO is the platform through which anyone, anywhere can generate the Dai stablecoin against crypto collateral assets.',
} satisfies AdapterExport;

