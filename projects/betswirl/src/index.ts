import { AdapterExport } from '@heyanon/sdk';
import { tools } from './tools';
import * as functions from './functions';

export default {
    tools,
    functions,
    description: `Wager on BetSwirl's games`,
} satisfies AdapterExport;
