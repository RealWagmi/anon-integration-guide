import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
    {
        name: 'swap',
        description:
            'Swap directly on the blockchain using Magpie Protocol. This feature aggregates liquidity across multiple liquidity sources to provide efficient and optimized trades for users. It ensures that the best available rates are secured while enabling seamless token-to-token swaps across supported networks.',
        required: ['chainName', 'fromTokenAddress', 'toTokenAddress', 'amount', 'account', 'toAddress'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute the swap.',
            },
            {
                name: 'fromTokenAddress',
                type: 'string',
                description: 'The fromTokenAddress is the address of the token you want to swap. It specifies the token you are sending in the transaction.',
            },
            {
                name: 'toTokenAddress',
                type: 'string',
                description:
                    "The toTokenAddress is the address of the token you want to receive in the swap. It defines the token you will get in return for the one you're sending.",
            },
            {
                name: 'amount',
                type: 'string',
                description: 'The amount is the quantity of the token you want to swap. It represents the total amount of the fromToken you are sending in the transaction.',
            },
            {
                name: 'account',
                type: 'string',
                description: 'The account is the wallet address that holds the token you want to swap. It is the source of the token you are sending in the transaction.',
            },
            {
                name: 'toAddress',
                type: 'string',
                description:
                    "The toAddress is the wallet address where you want to receive the swapped token. It is the destination for the token you will receive in exchange for the one you're sending.",
            },
            {
                name: 'slippage',
                type: 'number',
                description:
                    "Slippage is the maximum percentage you're willing to tolerate between the expected and actual price of your swap. It is set as a value between 0 and 1, where 0 means no price deviation is acceptable. Default is 0.005 (which equals to 0.5%)",
            },
        ],
    },
    {
        name: 'getTokens',
        description: 'The getTokens function retrieves a list of all supported tokens available for swapping.',
        required: ['searchValue'],
        props: [
            {
                name: 'searchValue',
                type: 'string',
                description: 'The searchValue can be either a single string or an array of addresses. It specifies the tokens or wallet addresses you want to search for.',
            },
        ],
    },
    {
        name: 'getBalances',
        description:
            'The getBalances function retrieves the current balances of specified tokens in your wallet. It helps you check how much of each token you have available before initiating a swap.',
        required: ['account'],
        props: [
            {
                name: 'account',
                type: 'string',
                description: 'The account parameter specifies the wallet address for which you want to check token balances.',
            },
        ],
    },
];
