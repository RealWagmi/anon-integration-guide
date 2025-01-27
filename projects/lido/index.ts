import { AdapterExport } from '@heyanon/sdk';
import { tools } from './tools';
import * as functions from './functions';

export default {
  tools,
  functions,
  description:
    'Lido is liquid staking protocol that allows users to stake their cryptocurrency tokens while maintaining liquidity',
} satisfies AdapterExport;
