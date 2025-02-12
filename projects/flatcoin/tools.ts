// tools.ts
import { getChainName } from "@heyanon/sdk";
import { supportedChains } from "./constants";

export const tools = [
    // UNIT LP Functions
    {
        name: "mintUnit",
        description: "Deposit rETH to mint UNIT tokens as a Liquidity Provider",
        props: [
            {
                name: "chainName",
                type: "string",
                enum: supportedChains.map(getChainName),
                description: "Name of the blockchain network (BASE)"
            },
            {
                name: "rethAmount",
                type: "string",
                description: "Amount of rETH to deposit"
            },
            {
                name: "slippageTolerance",
                type: "string",
                description: "Maximum slippage tolerance in percentage",
                default: "0.25"
            }
        ],
        required: ["chainName", "rethAmount"]
    },
    {
        name: "redeemUnit",
        description: "Redeem UNIT tokens back to rETH",
        props: [
            {
                name: "chainName",
                type: "string",
                enum: supportedChains.map(getChainName),
                description: "Name of the blockchain network (BASE)"
            },
            {
                name: "unitAmount",
                type: "string",
                description: "Amount of UNIT tokens to redeem"
            },
            {
                name: "minAmountOut",
                type: "string",
                description: "Minimum amount of rETH to receive"
            }
        ],
        required: ["chainName", "unitAmount", "minAmountOut"]
    },
    // Leverage Trading Functions
    {
        name: "openLongPosition",
        description: "Open a leveraged long position on rETH",
        props: [
            {
                name: "chainName",
                type: "string",
                enum: supportedChains.map(getChainName),
                description: "Name of the blockchain network (BASE)"
            },
            {
                name: "marginAmount",
                type: "string",
                description: "Amount of rETH to deposit as margin collateral"
            },
            {
                name: "leverage",
                type: "string",
                enum: ["2", "5", "10", "15", "25"],
                description: "Leverage multiplier (2x, 5x, 10x, 15x, or 25x)"
            }
        ],
        required: ["chainName", "marginAmount", "leverage"]
    },
    {
        name: "addCollateral",
        description: "Add more collateral to an existing leveraged position",
        props: [
            {
                name: "chainName",
                type: "string",
                enum: supportedChains.map(getChainName),
                description: "Name of the blockchain network (BASE)"
            },
            {
                name: "positionId",
                type: "string",
                description: "ID of the position to add collateral to"
            },
            {
                name: "additionalCollateral",
                type: "string",
                description: "Amount of additional rETH collateral to add"
            }
        ],
        required: ["chainName", "positionId", "additionalCollateral"]
    },
    {
        name: "closePosition",
        description: "Close an existing leveraged position",
        props: [
            {
                name: "chainName",
                type: "string",
                enum: supportedChains.map(getChainName),
                description: "Name of the blockchain network (BASE)"
            },
            {
                name: "positionId",
                type: "string",
                description: "ID of the position to close"
            },
            {
                name: "minFillPrice",
                type: "string",
                description: "Minimum acceptable price for closing the position"
            }
        ],
        required: ["chainName", "positionId", "minFillPrice"]
    }
];