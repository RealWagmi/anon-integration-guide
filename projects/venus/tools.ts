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
    name: "token",
    type: "string",
    description: "The token that is involved in the transaction.",
  },
  {
    name: "pool",
    type: "string",
    description: "The Pool in which the transaction will be executed.",
  },
  {
    name: "amount",
    type: "string",
    description: "Amount of tokens in decimal format",
  },
];

const basePropsNoAmount = baseProps.slice(0, 4);

const balanceProps = baseProps.slice(0, 3);

export const tools: AiTool[] = [
  {
    name: "borrowToken",
    description: "Borrow a token from venus lending protocol on a particular chain.",
    required: ["chainName", "account", "amount", "token", "pool"],
    props: baseProps,
  },
  {
    name: "repayToken",
    description: "Repay Token the token that was borrowed from venus lending protocol on a particular chain.",
    required: ["chainName", "account", "amount", "token", "pool"],
    props: baseProps,
  },
  {
    name: "mintToken",
    description: "Mint or supply token to venus lending protocol.",
    required: ["chainName", "account", "amount", "token", "pool"],
    props: baseProps,
  },
  {
    name: "balanceOf",
    description: "balance Of token in venus lending protocol.",
    required: ["chainName", "account", "token"],
    props: balanceProps,
  },
  {
    name: "redeemUnderlying",
    description: "redeem the supplied amount of underlying tokens.",
    required: ["chainName", "account", "amount", "token", "pool"],
    props: baseProps,
  },
  {
    name: "enterMarkets",
    description: "Enable a token as collateral in venus lending protocol for a particular pool.",
    required: ["chainName", "account", "amount", "token", "pool"],
    props: basePropsNoAmount,
  },
  {
    name: "exitMarket",
    description: "Disable a token as collateral in venus lending protocol for a particular pool.",
    required: ["chainName", "account", "amount", "token", "pool"],
    props: basePropsNoAmount,
  },
  {
    name: "borrowBalanceCurrentToken",
    description: "Borrow balance Of token using venus lending protocol.",
    required: ["chainName", "account", "token", "pool"],
    props: basePropsNoAmount,
  },



];