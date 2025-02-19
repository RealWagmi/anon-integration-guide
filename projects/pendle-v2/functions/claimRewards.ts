import { Address, encodeFunctionData } from "viem";
import {
    FunctionReturn,
    FunctionOptions,
    TransactionParams,
    toResult,
    getChainFromName
} from "@heyanon/sdk";
import { supportedChains } from "../constants";
import { gaugeControllerAbi } from "../abis";

interface Props {
    chainName: string;
    account: Address;
    marketAddress: Address;
}

/**
 * Claims rewards from a Pendle market
 * 
 * @description
 * This function claims accumulated rewards from a Pendle market.
 * It handles the interaction with the gauge controller to redeem market rewards.
 * 
 * @param props - The claim parameters
 * @param props.chainName - Name of the blockchain network
 * @param props.account - User's wallet address
 * @param props.marketAddress - Address of the Pendle market
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result with success/error message
 * 
 * @example
 * ```typescript
 * const result = await claimRewards({
 *     chainName: "ethereum",
 *     account: "0x...",
 *     marketAddress: "0x..."
 * }, tools);
 * ```
 */
export async function claimRewards(
    { chainName, account, marketAddress }: Props,
    { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
    if (!account) return toResult("Wallet not connected", true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId))
        return toResult(`Pendle is not supported on ${chainName}`, true);

    await notify("Preparing to claim rewards...");

    const tx: TransactionParams = {
        target: marketAddress,
        data: encodeFunctionData({
            abi: gaugeControllerAbi,
            functionName: "redeemMarketReward",
            args: []
        })
    };

    await notify("Waiting for transaction confirmation...");

    const result = await sendTransactions({ chainId, account, transactions: [tx] });
    const message = result.data[result.data.length - 1];

    return toResult(
        result.isMultisig
            ? message.message
            : `Successfully claimed Pendle rewards. ${message.message}`
    );
} 