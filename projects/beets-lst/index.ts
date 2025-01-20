import { AdapterExport } from '@heyanon/sdk';
import { tools } from './tools';
import * as functions from './functions';

export default {
    tools,
    functions,
    description: 'Integration with beets.fi Sonic liquid staking module (stS).  The integration supports staking S into stS and unstaking back to S.  The unstaking is a 2-step process: first undelegate, then claim Sonic after 14 days.',
} satisfies AdapterExport;
