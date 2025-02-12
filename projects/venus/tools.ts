import {AiTool, getChainName} from "@heyanon/sdk";
import {supportedChains} from "./constants";

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
        name: "tokenSymbol",
        type: "string",
        description: "The token symbol that is involved in the transaction.",
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

const APRProps = [
    {
        name: "chainName",
        type: "string",
        enum: supportedChains.map(getChainName),
        description: "Chain name where to execute the transaction",
    },
    {
        name: "tokenSymbol",
        type: "string",
        description: "The token symbol that is involved in the transaction.",
    },
    {
        name: "pool",
        type: "string",
        description: "The Pool in which the transaction will be executed.",
    },
];


const stakeProps = [
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
        name: "pid",
        type: "bigint",
        description: "PoolId in which staking should be done.",
    },
];

const basePropsNoAmount = baseProps.slice(0, 4);

const balanceProps = baseProps.slice(0, 3);

export const tools: AiTool[] = [
    {
        name: "borrowToken",
        description: "Borrow a token from venus lending protocol on a particular chain.",
        required: ["chainName", "account", "amount", "tokenSymbol", "pool"],
        props: baseProps,
    },
    {
        name: "repayToken",
        description: "Repay Token the token that was borrowed from venus lending protocol on a particular chain.",
        required: ["chainName", "account", "amount", "tokenSymbol", "pool"],
        props: baseProps,
    },
    {
        name: "mintToken",
        description: "Mint or supply token to venus lending protocol.",
        required: ["chainName", "account", "amount", "tokenSymbol", "pool"],
        props: baseProps,
    },
    {
        name: "getVenusBalance",
        description: "balance Of token in venus lending protocol.",
        required: ["chainName", "account", "tokenSymbol"],
        props: balanceProps,
    },
    {
        name: "redeemUnderlying",
        description: "redeem the supplied amount of underlying tokens.",
        required: ["chainName", "account", "amount", "tokenSymbol", "pool"],
        props: baseProps,
    },
    {
        name: "enterMarkets",
        description: "Enable a token as collateral in venus lending protocol for a particular pool.",
        required: ["chainName", "account", "amount", "tokenSymbol", "pool"],
        props: basePropsNoAmount,
    },
    {
        name: "exitMarket",
        description: "Disable a token as collateral in venus lending protocol for a particular pool.",
        required: ["chainName", "account", "amount", "tokenSymbol", "pool"],
        props: basePropsNoAmount,
    },
    {
        name: "borrowBalanceCurrentToken",
        description: "Borrow balance Of token using venus lending protocol.",
        required: ["chainName", "account", "tokenSymbol", "pool"],
        props: basePropsNoAmount,
    },
    {
        name: "getBorrowAPR",
        description: "Get Current Supply APR for a token in a particular pool.",
        required: ["chainName", "tokenSymbol", "pool"],
        props: APRProps,
    },
    {
        name: "getSupplyAPR",
        description: "Get Current Supply APR for a token in a particular pool.",
        required: ["chainName", "tokenSymbol", "pool"],
        props: APRProps,
    },
    {
        name: "getAccountLiquidity",
        description: "Get the borrow Limit and shortfall of a account for a token in particular pool.",
        required: ["chainName", "account", "tokenSymbol", "pool"],
        props: basePropsNoAmount,
    },
    {
        name: "stakeXVS",
        description: "Stake XVS token in venus pool.",
        required: ["chainName", "account", "amount", "pid"],
        props: stakeProps,
    },
    {
        name: "unstakeXVS",
        description: "UnStake XVS token in venus pool.",
        required: ["chainName", "account", "amount", "pid"],
        props: stakeProps,
    },
];