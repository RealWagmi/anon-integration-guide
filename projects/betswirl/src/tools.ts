import { AiTool, EVM } from '@heyanon/sdk';
import { COINTOSS_FACE, MAX_SELECTABLE_DICE_NUMBER, MIN_SELECTABLE_DICE_NUMBER, MIN_SELECTABLE_ROULETTE_NUMBER, MAX_SELECTABLE_ROULETTE_NUMBER } from '@betswirl/sdk-core';

import { supportedChains } from './constants';

const commonProps = [
    {
        name: 'chainName',
        type: 'string',
        enum: supportedChains.map(EVM.utils.getChainName),
        description: 'Chain name where to execute the transaction'
    },
    {
        name: 'account',
        type: 'string',
        description: 'The account address of the player.'
    },
    {
        name: 'tokenSymbol',
        type: 'string',
        description: 'The token symbol to bet with.'
    },
    {
        name: 'betAmount',
        type: 'string',
        description: 'The bet amount.'
    }
];
const commonPropsNames = commonProps.map(commonProp => commonProp.name);

export const tools: AiTool[] = [
    {
        name: 'coinToss',
        description: 'The player is betting that the rolled face will be the one chosen.',
        required: [...commonPropsNames, 'face'],
        props: [
            ...commonProps,
            {
                name: 'face',
                type: 'string',
                enum: [COINTOSS_FACE.HEADS, COINTOSS_FACE.TAILS],
                description: 'The face of the coin to bet on.'
            }
        ]
    },
    {
        name: 'dice',
        description: 'The player is betting that the rolled number will be above this chosen number.',
        required: [...commonPropsNames, 'number'],
        props: [
            ...commonProps,
            {
                name: 'number',
                type: 'number',
                enum: Array.from({ length: MAX_SELECTABLE_DICE_NUMBER - MIN_SELECTABLE_DICE_NUMBER + 1 }, (_, i) => MIN_SELECTABLE_DICE_NUMBER + i),
                description: 'The number to bet on.'
            }
        ]
    },
    {
        name: 'roulette',
        description: 'The player is betting that the rolled number will be one of the chosen numbers.',
        required: [...commonPropsNames, 'numbers'],
        props: [
            ...commonProps,
            {
                name: 'numbers',
                type: 'array',
                minItems: 1,
                maxItems: MAX_SELECTABLE_ROULETTE_NUMBER,
                items: {
                    type: 'number',
                    minimum: MIN_SELECTABLE_ROULETTE_NUMBER,
                    maximum: MAX_SELECTABLE_ROULETTE_NUMBER
                },
                description: 'The numbers to bet on.'
            }
        ]
    },
    {
        name: 'getBets',
        description: 'Get bets from player.',
        required: ['chainName', 'account'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(EVM.utils.getChainName),
                description: 'Chain name where to execute the transaction'
            },
            {
                name: 'account',
                type: 'string',
                description: 'The account address of the player.'
            }
        ]
    }
];
