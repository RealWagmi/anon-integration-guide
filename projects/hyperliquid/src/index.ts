import { AdapterExport } from '@heyanon/sdk';
import { tools } from './tools';
import * as functions from './functions';

export default {
    tools,
    functions,
    description:
        'Hyperliquid is Layer 1 blockchain providing CEX-like trading experience through on-chain order books. Enables USDC bridging and supports both spot/perpetual trading with full position management',
} satisfies AdapterExport;
