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
                name: "collateralAmount",
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
        required: ["chainName", "collateralAmount", "leverage"]
    }
];