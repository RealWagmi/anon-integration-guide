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
];

const basePropsNoAmount = baseProps.slice(0, 2);

export const tools: AiTool[] = [
  {
    name: "supplyUSDC",
    description:
      "Supplies USDC tokens to the lending protocol to earn interest.",
    required: ["chainName", "account", "amount"],
    props: baseProps,
  },
  {
    name: "withdrawUSDC",
    description:
      "Withdraws previously supplied USDC tokens from the lending protocol.",
    required: ["chainName", "account", "amount"],
    props: baseProps,
  },
  {
    name: "borrowUSDC",
    description:
      "Borrows USDC tokens from the lending protocol using supplied collateral.",
    required: ["chainName", "account", "amount"],
    props: baseProps,
  },
  {
    name: "repayUSDC",
    description: "Repays borrowed USDC tokens back to the lending protocol.",
    required: ["chainName", "account", "amount"],
    props: baseProps,
  },
  {
    name: "maxWithdrawUSDC",
    description:
      "Withdraws all available USDC tokens from the lending protocol.",
    required: ["chainName", "account"],
    props: basePropsNoAmount,
  },
  {
    name: "supplyWETH",
    description:
      "Supplies WETH tokens to the lending protocol to earn interest.",
    required: ["chainName", "account", "amount"],
    props: baseProps,
  },
  {
    name: "withdrawWETH",
    description:
      "Withdraws previously supplied WETH tokens from the lending protocol.",
    required: ["chainName", "account", "amount"],
    props: baseProps,
  },
  {
    name: "borrowWETH",
    description:
      "Borrows WETH tokens from the lending protocol using supplied collateral.",
    required: ["chainName", "account", "amount"],
    props: baseProps,
  },
  {
    name: "repayWETH",
    description: "Repays borrowed WETH tokens back to the lending protocol.",
    required: ["chainName", "account", "amount"],
    props: baseProps,
  },
  {
    name: "maxWithdrawWETH",
    description:
      "Withdraws all available WETH tokens from the lending protocol.",
    required: ["chainName", "account"],
    props: basePropsNoAmount,
  },
];
