import { AiTool, getChainName } from "@heyanon/sdk";
import { supportedChains } from "./constants";

const baseProps = [
  {
    name: "chainName",
    type: "string",
    enum: supportedChains.map(getChainName),
    description: "Chain name where to execute the transaction",
  },
  {
    name: "account",
    type: "string",
    description: "Account address that will execute the transaction",
  },
  {
    name: "amount",
    type: "string",
    description: "Amount of tokens in decimal format",
  },
  {
    name: "tokenAddress",
    type: "string",
    description: "Address of the token that needs to executed.",
  },
];

const basePropsNoAmount = baseProps.slice(0, 2);

export const tools: AiTool[] = [
  {
    name: "borrowRatePerBlock",
    description:
      "Borrows rate per block",
    required: ["chainName", "account"],
    props: baseProps,
  },
  {
    name: "borrowToken",
    description:
      "Borrow token from venus lending protocol.",
    required: ["chainName", "account", "amount", "tokenAddress"],
    props: baseProps,
  },
  {
    name: "repayToken",
    description:
      "Repay Token with interest",
    required: ["chainName", "account", "amount", "tokenAddress"],
    props: baseProps,
  },
  {
    name: "mintToken",
    description: "mint token using venus lending protocol.",
    required: ["chainName", "account", "amount", "tokenAddress"],
    props: baseProps,
  },
  {
    name: "balanceOf",
    description: "balance Of token using venus lending protocol.",
    required: ["chainName", "account", "tokenAddress"],
    props: baseProps,
  },
  {
    name: "redeemToken",
    description: "redeem token using venus lending protocol.",
    required: ["chainName", "account", "amount", "tokenAddress"],
    props: baseProps,
  },
  {
    name: "borrowBalanceCurrentToken",
    description: "Borrow balance Of token using venus lending protocol.",
    required: ["chainName", "account", "tokenAddress"],
    props: baseProps,
  },



];