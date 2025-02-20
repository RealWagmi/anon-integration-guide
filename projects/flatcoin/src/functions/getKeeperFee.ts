// functions/getKeeperFee.ts
import { encodeFunctionData, decodeAbiParameters } from "viem";
import { FunctionReturn, toResult, Chain } from "@heyanon/sdk";
import { ADDRESSES } from "../constants";

export const keeperFeeAbi = [
    {
        name: "getKeeperFee",
        inputs: [],
        outputs: [{ type: "uint256", name: "keeperFee" }],
        stateMutability: "view",
        type: "function"
    }
] as const;

/**
 * Gets the current keeper fee from the KeeperFee contract
 * @param provider - Provider for blockchain interactions
 * @returns Current keeper fee as bigint
 */
export async function getKeeperFee(provider: any): Promise<bigint> {
    try {
        const addresses = ADDRESSES[Chain.BASE];
        const keeperFeeData = encodeFunctionData({
            abi: keeperFeeAbi,
            functionName: "getKeeperFee"
        });

        const result = await provider.call({
            to: addresses.KEEPER_FEE,
            data: keeperFeeData
        });

        const [keeperFee] = decodeAbiParameters(
            [{ type: "uint256" }],
            result as `0x${string}`
        );

        return keeperFee;
    } catch (error) {
        const errorMessage = error instanceof Error 
            ? error.message 
            : 'An unknown error occurred';
        console.error(`Error getting keeper fee: ${errorMessage}`);
        return 0n;
    }
}