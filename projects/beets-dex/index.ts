import { AdapterExport } from '@heyanon/sdk'';
import { tools } from './tools';
import * as functions from './functions';

export default {
    tools,
    functions,
    description: 'Beets exchange allows you to swap almost instantly between hundreds of tokens, leveraging Sonic Chain ultrafast transaction speed',
} satisfies AdapterExport;
