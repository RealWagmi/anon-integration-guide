import { AdapterExport } from '@heyanon/sdk';
import { getLiquidity } from './functions/trading/leverage/getLiquidity.js';

export const adapter: AdapterExport = {
  functions: {
    getLiquidity
  },
  tools: {},
  description: 'Integration with Amped Finance'
};
