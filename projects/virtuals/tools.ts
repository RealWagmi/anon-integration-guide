import { AiTool, getChainName } from '@heyanon/sdk';
// import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'interactCryptoAgent',
        description:
            'There is multi-purpose crypto agent implemented by Virtuals GAME engine that let users interact with and send a prompt to it. It analyzes the user prompt and takes appropriate action. For example a user can send the prompt "Let me know the current ETH price" to it',
        required: ['prompt'],
        props: [
            {
                name: 'prompt',
                type: 'string',
                description: 'The user prompt that should be sent to the agent',
            },
        ],
    },
];
