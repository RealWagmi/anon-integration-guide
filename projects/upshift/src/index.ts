import { AdapterExport } from '@heyanon/sdk';
import { tools } from './tools';
import * as functions from './functions';

export default {
    tools,
    functions,
    description: 'Upshift is a digital storefront for on-chain yield, powered by August Digital.',
} satisfies AdapterExport;
