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
     import { getChainName } from "@heyanon/sdk";
     import { supportedChains } from "./constants";
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
     import { ChainId } from "@heyanon/sdk";

     export const supportedChains = [ChainId.ETHEREUM];
     ```

   - Use `getChainName` utility to ensure consistent chain naming

4. **Clarity**

   - Ensure descriptions are understandable and not overly verbose.
   - Avoid unnecessary complexity in parameter descriptions.

## Example Implementation

```typescript
import { getChainName } from "@heyanon/sdk";
import { supportedChains } from "./constants";

export const functions = [
  {
    name: "depositExample",
    description: "Deposits a specified amount of tokens into the protocol.",
    parameters: {
      type: "object",
      properties: {
        chainName: {
          type: "string",
          enum: supportedChains.map(getChainName),
          description: "Name of the blockchain network",
        },
        userAddress: { type: "string", description: "User's wallet address" },
        assetAddress: { type: "string", description: "Token contract address" },
        amount: { type: "string", description: "Amount to deposit" },
      },
      required: ["chainName", "userAddress", "assetAddress", "amount"],
    },
  },
  {
    name: "getRewardsExample",
    description: "Retrieves the rewards earned by a user.",
    parameters: {
      type: "object",
      properties: {
        chainName: {
          type: "string",
          enum: supportedChains.map(getChainName),
          description: "Name of the blockchain network",
        },
        userAddress: { type: "string", description: "User's wallet address" },
      },
      required: ["chainName", "userAddress"],
    },
  },
];
```

### OpenAI Function Calling Specification

Refer to the OpenAI documentation for function calling:

[Function Calling - OpenAI API](https://platform.openai.com/docs/guides/gpt/function-calling)