import { AiTool, getChainName } from '@heyanon/sdk';
import { supportedChains } from './constants.js';
import { addLiquidity } from './functions/liquidity/addLiquidity.js';
import { removeLiquidity } from './functions/liquidity/removeLiquidity.js';
import { getPerpsLiquidity } from './functions/trading/leverage/getPerpsLiquidity.js';
import { getPosition } from './functions/trading/leverage/getPositions.js';
import { getALPAPR } from './functions/liquidity/getALPAPR.js';
import { getAcceptedTokenBalances } from './functions/liquidity/getAcceptedTokenBalances.js';
import { getUserLiquidity } from './functions/liquidity/getUserLiquidity.js';
import { getPoolLiquidity } from './functions/liquidity/getPoolLiquidity.js';
import { closePosition } from './functions/trading/leverage/closePosition.js';

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
        description: 'Remove liquidity from the protocol by redeeming GLP for tokens. For native token (S) redemption, use the NATIVE_TOKEN address from CONTRACT_ADDRESSES. The minimum output amount is calculated automatically based on current prices and slippage tolerance.',
        required: ['chainName', 'account', 'tokenOut', 'amount'],
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
                description: 'Account address that will receive the redeemed tokens',
            },
            {
                name: 'tokenOut',
                type: 'string',
                description: 'Address of the token to receive when removing liquidity. Use NATIVE_TOKEN address for native token (S) redemption.',
            },
            {
                name: 'amount',
                type: 'string',
                description: 'Amount of GLP to redeem (in decimal format)',
            },
            {
                name: 'slippageTolerance',
                type: 'number',
                description: 'Optional: Maximum acceptable slippage as a percentage (e.g., 0.5 for 0.5%). Defaults to 0.5%.',
                optional: true,
            },
            {
                name: 'skipSafetyChecks',
                type: 'boolean',
                description: 'Optional: Skip balance and liquidity verification checks',
                optional: true,
            }
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
    },
    {
        name: 'getAcceptedTokenBalances',
        description: 'Get balances and USD values of all accepted liquidity tokens',
        required: ['chainName'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Name of the blockchain network (only "sonic" is supported)',
            }
        ],
        function: getAcceptedTokenBalances
    },
    {
        name: 'getUserLiquidity',
        description: 'Get user\'s ALP (Amped Liquidity Provider) information including balance, USD value, and unclaimed rewards',
        required: ['chainName', 'account'],
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
                description: 'Account address to check liquidity for',
            }
        ],
        function: getUserLiquidity
    },
    {
        name: 'getPoolLiquidity',
        description: 'Get total pool liquidity information including GLP supply and Assets Under Management (AUM)',
        required: ['chainName'],
        props: [
            {
                name: 'chainName',
                type: 'string',
                enum: supportedChains.map(getChainName),
                description: 'Name of the blockchain network (only "sonic" is supported)',
            }
        ],
        function: getPoolLiquidity
    },
    {
        name: 'getPosition',
        description: 'Get details of a user\'s perpetual trading position including size, collateral, PnL, and other metrics',
        required: ['chainName', 'account', 'indexToken', 'collateralToken', 'isLong'],
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
                description: 'Account address to check position for',
            },
            {
                name: 'indexToken',
                type: 'string',
                description: 'Address of the token being traded',
            },
            {
                name: 'collateralToken',
                type: 'string',
                description: 'Address of the token used as collateral',
            },
            {
                name: 'isLong',
                type: 'boolean',
                description: 'Whether this is a long position (true) or short position (false)',
            }
        ],
        function: getPosition
    },
    {
        name: 'closePosition',
        description: 'Close an existing perpetual trading position, either partially or fully',
        required: ['chainName', 'account', 'indexToken', 'collateralToken', 'isLong'],
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
                description: 'Account address that owns the position',
            },
            {
                name: 'indexToken',
                type: 'string',
                description: 'Address of the token being traded',
            },
            {
                name: 'collateralToken',
                type: 'string',
                description: 'Address of the token used as collateral',
            },
            {
                name: 'isLong',
                type: 'boolean',
                description: 'Whether this is a long position (true) or short position (false)',
            },
            {
                name: 'sizeDelta',
                type: 'string',
                description: 'Optional: Amount of position to close in USD. If not provided, closes entire position.',
                optional: true
            },
            {
                name: 'acceptablePrice',
                type: 'string',
                description: 'Optional: Minimum acceptable price for longs, maximum acceptable price for shorts. Defaults to 2% slippage.',
                optional: true
            },
            {
                name: 'executionFee',
                type: 'string',
                description: 'Optional: Fee paid for execution. Defaults to 0.001 S.',
                optional: true
            },
            {
                name: 'withdrawETH',
                type: 'boolean',
                description: 'Optional: Whether to withdraw in native token (S) or keep as wrapped. Defaults to false.',
                optional: true
            }
        ],
        function: closePosition
    }
];
