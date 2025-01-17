// tools.ts
import { getChainName } from "@heyanon/sdk";
import { supportedChains } from "./constants";

export const functions = [
    // UNIT LP Functions
    {
        name: "mintUnit",
        description: "Deposit rETH to mint UNIT tokens as a Liquidity Provider",
        parameters: {
            type: "object",
            properties: {
                chainName: {
                    type: "string",
                    enum: supportedChains.map(getChainName),
                    description: "Name of the blockchain network (BASE)"
                },
                rethAmount: {
                    type: "string",
                    description: "Amount of rETH to deposit"
                },
                slippageTolerance: {
                    type: "string",
                    description: "Maximum slippage tolerance in percentage",
                    default: "0.25"  // Default 0.25% slippage
                }
            },
            required: ["chainName", "rethAmount"]
        }
    },
    // Leverage Trading Functions
    {
        name: "openLongPosition",
        description: "Open a leveraged long position on rETH",
        parameters: {
            type: "object",
            properties: {
                chainName: {
                    type: "string",
                    enum: supportedChains.map(getChainName),
                    description: "Name of the blockchain network (BASE)"
                },
                collateralAmount: {
                    type: "string",
                    description: "Amount of rETH to deposit as margin collateral"
                },
                leverage: {
                    type: "string",
                    enum: ["2", "5", "10", "15", "25"],
                    description: "Leverage multiplier (2x, 5x, 10x, 15x, or 25x)"
                }
            },
            required: ["chainName", "collateralAmount", "leverage"]
        }
    }
];