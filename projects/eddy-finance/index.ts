import { AdapterExport } from '@heyanon/sdk';
import { tools } from './tools';
import * as functions from './functions';

export default {
    tools,
    functions,
    description:
        'Eddy Finance is a universal cross-chain DEX and a liquidity layer, enabling seamless movement of native assets across both EVM and non-EVM chains like Bitcoin, Ethereum, Solana, Base, and more—without the need for wrapping.Eddy uses threshold signing schemes and a unique universal smart router that executes advanced algorithms like concentrated liquidity and stableswap algos across chains reducing slippage and gas costs',
} satisfies AdapterExport;
