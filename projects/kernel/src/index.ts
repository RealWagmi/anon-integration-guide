import { AdapterExport } from '@heyanon/sdk';
import { tools } from './tools';
import * as functions from './functions';

export default {
    tools,
    functions,
    description: 'Kernel is a restaking protocol that allows user to restake their liquid staking tokens (LSTs) or BNB to extend the security blanket to a diverse array of applications within the network, all while unlocking new streams of rewards.',
} satisfies AdapterExport;
