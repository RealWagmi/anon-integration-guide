# Tools Implementation Guide

Each module must include a `tools.ts` file that defines functions for LLM integration.

## Guidelines

1. **Function Definitions**

   - Provide clear and concise descriptions.
   - Use accurate parameter types and descriptions.
   - Follow the OpenAI function calling specification.

2. **Formatting**

   - Use the required format for LLM function definitions.
   - Include `name`, `description`, `parameters`, and `required` fields.

3. **Chain Support**

   - Import required chain utilities:
     ```typescript
     import { AiTool, EVM } from '@heyanon/sdk';
     import { supportedChains, supportedPools } from './constants';
     ```
   - Use chain enumeration for network parameters:
     ```typescript
     chainName: {
         type: 'string',
         enum: supportedChains.map(getChainName),
         description: 'Name of the blockchain network'
     }
     ```
   - Define supported chains in your module's `constants.ts`:

     ```typescript
     import { Chain, EVM } from '@heyanon/sdk';
     const { ChainIds } = EVM.constants;
     export const supportedChains = [ChainIds[Chain.BSC], ChainIds[Chain.ETHEREUM], ChainIds[Chain.BASE]];
     ```

   - Use `getChainName` utility to ensure consistent chain naming

4. **Clarity**

   - Ensure descriptions are understandable and not overly verbose.
   - Avoid unnecessary complexity in parameter descriptions.

## Example Implementation

```typescript
import { AiTool, EVM } from '@heyanon/sdk';
import { supportedChains } from "./constants";

const { getChainName } = EVM.utils;
export const functions = [
  {
		name: 'mintToken',
		description: 'Mint or supply token to venus lending protocol.',
		required: ['chainName', 'account', 'amount', 'tokenSymbol', 'pool'],
		props: [
			{ name: 'chainName', type: 'string', enum: supportedChains.map(getChainName), description: 'Chain name where to execute the transaction' },
			{ name: 'account', type: 'string', description: 'Account address that will execute the transaction' },
			{ name: 'tokenSymbol', type: 'string', description: 'The token symbol that is involved in the transaction.' },
			{ name: 'pool', type: 'string', enum: supportedPools, description: 'The Pool in which the transaction will be executed.' },
			{ name: 'amount', type: 'string', description: 'Amount of tokens in decimal format' },
		],
	},
  {
		name: 'getUserPositionOnSKY',
		description: 'Get complete user position in Sky protocol including STR staking and SSR positions',
		required: ['chainName', 'account'],
		props: [
			{
				name: 'chainName',
				type: 'string',
				enum: supportedChains.map(getChainName),
				description: 'Chain name',
			},
			{
				name: 'account',
				type: 'string',
				description: 'Account address to check',
			},
		],
	},
];
```

### OpenAI Function Calling Specification

Refer to the OpenAI documentation for function calling:

[Function Calling - OpenAI API](https://platform.openai.com/docs/guides/gpt/function-calling)
