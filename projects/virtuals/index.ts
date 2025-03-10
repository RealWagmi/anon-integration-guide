import "dotenv/config";
import { AdapterExport } from '@heyanon/sdk';
import { tools } from './tools';
import * as functions from './functions';

export default {
    tools,
    functions,
    description:
        'Integrate Virtuals with HeyAnon. There are some functionalities such as interacting with the crypto agent. There is a crypto GAME agent implemented using Virtauls protocol that let users to interact with it. Users are able to get a token price or analyze the market',
} satisfies AdapterExport;
