import type { AiTool } from '@heyanon/sdk';

export const tools: AiTool[] = [
    {
        name: 'getAIIntel',
        description: 'Fetch the latest news to be consumed by AI agents for analysis and decision making',
        required: [],
        props: [
            {
                name: 'limit',
                type: 'number',
                description: 'The number of news to fetch',
            },
        ],
    },
    {
        name: 'getAddressActivities',
        description: 'Fetch the latest address-based activities to be consumed by AI agents for analysis and decision making',
        required: ['account'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will be used to fetch the activities',
            },
            {
                name: 'chainName',
                type: 'string',
                description: 'Chains to fetch the activities from',
            },
            {
                name: 'platform',
                type: 'string',
                description: 'Platforms to fetch the activities from',
            },
            {
                name: 'tag',
                type: 'string',
                description: 'Tag to filter the activities',
            },
            {
                name: 'type',
                type: 'string',
                description: 'Type to filter the activitiest',
            },
            {
                name: 'limit',
                type: 'number',
                description: 'The number of activities to fetch',
            },
        ],
    },
];
