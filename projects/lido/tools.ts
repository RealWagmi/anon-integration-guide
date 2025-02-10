import { AiTool } from '@heyanon/sdk';
import { supportedChains } from './constants';

export const tools: AiTool[] = [
  {
    name: 'stakeETH',
    description: 'Stake ETH through Lido and receive stETH in return',
    required: ['chainName', 'account', 'amount'],
    props: [
      {
        name: 'chainName',
        type: 'string',
        enum: supportedChains,
        description: 'The blockchain network to stake ETH on',
      },
      {
        name: 'account',
        type: 'string',
        description: 'The account address staking ETH',
      },
      {
        name: 'amount',
        type: 'string',
        description: 'The amount of ETH to stake in decimal format',
      },
    ],
  },
  {
    name: 'wrapStETH',
    description: 'Wrap stETH into wstETH (wrapped stETH)',
    required: ['chainName', 'account', 'amount'],
    props: [
      {
        name: 'chainName',
        type: 'string',
        enum: supportedChains,
        description: 'The blockchain network to perform the wrapping',
      },
      {
        name: 'account',
        type: 'string',
        description: 'The account address performing the wrapping',
      },
      {
        name: 'amount',
        type: 'string',
        description: 'The amount of stETH to wrap into wstETH',
      },
    ],
  },
  {
    name: 'unwrapWstETH',
    description: 'Unwrap wstETH back into stETH',
    required: ['chainName', 'account', 'amount'],
    props: [
      {
        name: 'chainName',
        type: 'string',
        enum: supportedChains,
        description: 'The blockchain network to perform the unwrapping',
      },
      {
        name: 'account',
        type: 'string',
        description: 'The account address performing the unwrapping',
      },
      {
        name: 'amount',
        type: 'string',
        description: 'The amount of wstETH to unwrap into stETH',
      },
    ],
  },
  {
    name: 'getStETHBalance',
    description: 'Retrieve the stETH balance for a specific account',
    required: ['chainName', 'account'],
    props: [
      {
        name: 'chainName',
        type: 'string',
        enum: supportedChains,
        description: 'The blockchain network to query',
      },
      {
        name: 'account',
        type: 'string',
        description: 'The account address to query the stETH balance',
      },
    ],
  },
  {
    name: 'getWstETHBalance',
    description: 'Retrieve the wstETH balance for a specific account',
    required: ['chainName', 'account'],
    props: [
      {
        name: 'chainName',
        type: 'string',
        enum: supportedChains,
        description: 'The blockchain network to query',
      },
      {
        name: 'account',
        type: 'string',
        description: 'The account address to query the wstETH balance',
      },
    ],
  },
  {
    name: 'requestWithdrawStETH',
    description: 'Request a withdrawal of stETH back to ETH',
    required: ['chainName', 'account', 'amount'],
    props: [
      {
        name: 'chainName',
        type: 'string',
        enum: supportedChains,
        description: 'The blockchain network to perform the withdrawal',
      },
      {
        name: 'account',
        type: 'string',
        description: 'The account address requesting the withdrawal',
      },
      {
        name: 'amount',
        type: 'string',
        description: 'The amount of stETH to withdraw to ETH',
      },
    ],
  },
  {
    name: 'claimWithdrawStETH',
    description: 'Claim a pending withdrawal of ETH',
    required: ['chainName', 'account', 'requestIds'],
    props: [
      {
        name: 'chainName',
        type: 'string',
        enum: supportedChains,
        description:
          'The blockchain network where the withdrawal claim is made',
      },
      {
        name: 'account',
        type: 'string',
        description: 'The account address claiming the withdrawal',
      },
      {
        name: 'requestIds',
        type: 'string',
        description: 'The IDs of the withdrawal to claim',
      },
    ],
  },
  {
    name: 'getWstETHByStETH',
    description: 'Calculate how much wstETH you get for a given stETH amount',
    required: ['chainName', 'amount'],
    props: [
      {
        name: 'chainName',
        type: 'string',
        enum: supportedChains,
        description: 'The blockchain network to query',
      },
      {
        name: 'amount',
        type: 'string',
        description: 'The amount of stETH to convert',
      },
    ],
  },
  {
    name: 'getStETHByWstETH',
    description: 'Calculate how much stETH you get for a given wstETH amount',
    required: ['chainName', 'amount'],
    props: [
      {
        name: 'chainName',
        type: 'string',
        enum: supportedChains,
        description: 'The blockchain network to query',
      },
      {
        name: 'amount',
        type: 'string',
        description: 'The amount of wstETH to convert',
      },
    ],
  },
  {
    name: 'getTotalStaked',
    description: 'Retrieve the total staked ETH in Lido',
    required: ['chainName'],
    props: [
      {
        name: 'chainName',
        type: 'string',
        enum: supportedChains,
        description: 'The blockchain network to query',
      },
    ],
  },
  {
    name: 'getTotalRewardsEarned',
    description: 'Calculate the total rewards earned for stETH staking',
    required: ['chainName', 'account'],
    props: [
      {
        name: 'chainName',
        type: 'string',
        enum: supportedChains,
        description: 'The blockchain network to query',
      },
      {
        name: 'account',
        type: 'string',
        description: 'The account address to query rewards for',
      },
    ],
  },
  {
    name: 'getLidoAPR',
    description:
      'Fetches the latest Lido APR from the official Lido API',
    required: ['chainName'],
    props: [
      {
        name: 'chainName',
        type: 'string',
        enum: supportedChains,
        description: 'The blockchain network to query',
      },
    ],
  },
];
