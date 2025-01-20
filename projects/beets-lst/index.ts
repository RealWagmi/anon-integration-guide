import { AdapterExport } from '@heyanon/sdk'';
import { tools } from './tools';
import * as functions from './functions';

export default {
    tools,
    functions,
    description: 'Integration with beets.fi Sonic liquid staking module (stS)',
} satisfies AdapterExport;
