import { AiTool, EVM } from '@heyanon/sdk';
import { supportedChains } from './constants';

const { getChainName } = EVM.utils;

export const tools: AiTool[] = [
  {
    name: 'makeAsk',
    description: 'Create a new OTC ask (offer) on the marketplace.',
    required: ['chainName', 'ask'],
    props: [
      {
        name: 'chainName',
        type: 'string',
        enum: supportedChains.map(getChainName),
        description: 'Chain name where to create the ask',
      },
      {
        name: 'ask',
        type: 'object',
        description: 'Ask object with all required ask fields',
      },
    ],
  },
  {
    name: 'fillAsk',
    description: 'Fill an existing OTC ask as a taker.',
    required: ['chainName', 'taker', 'maker', 'asset', 'idx'],
    props: [
      {
        name: 'chainName',
        type: 'string',
        enum: supportedChains.map(getChainName),
        description: 'Chain name where the ask exists',
      },
      { name: 'taker', type: 'string', description: 'Taker address' },
      { name: 'maker', type: 'string', description: 'Maker address' },
      { name: 'asset', type: 'string', description: 'Asset address' },
      { name: 'idx', type: 'string', description: 'Ask index' },
    ],
  },
  {
    name: 'cancelOpenAsk',
    description: 'Cancel an open ask and return tokens to the maker.',
    required: ['chainName', 'maker', 'asset', 'id'],
    props: [
      {
        name: 'chainName',
        type: 'string',
        enum: supportedChains.map(getChainName),
        description: 'Chain name where the ask exists',
      },
      { name: 'maker', type: 'string', description: 'Maker address' },
      { name: 'asset', type: 'string', description: 'Asset address' },
      { name: 'id', type: 'string', description: 'Ask id' },
    ],
  },
  {
    name: 'getAllOpenAsks',
    description: 'Get all open asks currently on the marketplace.',
    required: ['chainName'],
    props: [
      {
        name: 'chainName',
        type: 'string',
        enum: supportedChains.map(getChainName),
        description: 'Chain name to query',
      },
    ],
  },
];
