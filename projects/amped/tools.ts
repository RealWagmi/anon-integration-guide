import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants.js';
import { addLiquidity } from './functions/liquidity/addLiquidity.js';
import { removeLiquidity } from './functions/liquidity/removeLiquidity.js';
import { getPerpsLiquidity } from './functions/trading/leverage/getPerpsLiquidity.js';
import { getALPAPR } from './functions/liquidity/getALPAPR.js';

interface Tool extends AiTool {
  function: Function;
}

export const tools: Tool[] = [
    {
        name: 'example',
        description: 'Example function that demonstrates how to interact with the protocol. It shows basic transaction flow, including checking balances, preparing transaction data, and handling approvals if needed.',
        required: ['chainName', 'account', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Chain name where to execute the example',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address that will execute the example',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens for the example in decimal format',
            },
        ],
        function: () => {}
    },
    {
        name: 'addLiquidity',
        description: 'Add liquidity to the protocol by providing tokens in exchange for GLP',
        required: ['chainName', 'tokenIn', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Name of the blockchain network',
            },
            {
                name: 'tokenIn',
                type: 'string',
                description: 'Address of the token to provide as liquidity',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of tokens to provide as liquidity',
            },
            {
                name: 'minOut',
                type: 'string',
                description: 'Minimum amount of GLP tokens to receive',
                optional: true,
            },
        ],
        function: addLiquidity
    },
    {
        name: 'removeLiquidity',
        description: 'Remove liquidity from the protocol by redeeming GLP for tokens',
        required: ['chainName', 'tokenOut', 'amount'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Name of the blockchain network',
            },
            {
                name: 'tokenOut',
                type: 'string',
                description: 'Address of the token to receive when removing liquidity',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of GLP to redeem',
            },
            {
                name: 'minOut',
                type: 'string',
                description: 'Minimum amount of tokens to receive',
                optional: true,
            },
        ],
        function: removeLiquidity
    },
    {
        name: 'getPerpsLiquidity',
        description: 'Get perpetual trading liquidity information for a token, including max leverage, position sizes, and funding rates',
        required: ['chainName', 'account', 'indexToken', 'collateralToken', 'isLong'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Name of the blockchain network',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to check liquidity for',
            },
            {
                name: 'indexToken',
                type: 'string',
                description: 'Address of the token to trade',
            },
            {
                name: 'collateralToken',
                type: 'string',
                description: 'Address of the token to use as collateral',
            },
            {
                name: 'isLong',
                type: 'boolean',
                description: 'Whether to check long or short position liquidity',
            }
        ],
        function: getPerpsLiquidity
    },
    {
        name: 'getALPAPR',
        description: 'Get APR information for ALP (Amped Liquidity Provider) tokens, including base APR and reward rates',
        required: ['chainName', 'account', 'tokenAddress'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Name of the blockchain network (only "sonic" is supported)',
            },
            {
                name: 'account',
                type: 'string',
                description: 'Account address to check APR for',
            },
            {
                name: 'tokenAddress',
                type: 'string',
                description: 'The ALP token address to check APR for',
            }
        ],
        function: getALPAPR
    }
];
