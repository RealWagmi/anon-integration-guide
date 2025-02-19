import { Address, encodeFunctionData, parseUnits } from "viem";
import {
    FunctionReturn,
    FunctionOptions,
    TransactionParams,
    toResult,
    getChainFromName,
    checkToApprove
} from "@heyanon/sdk";
import { supportedChains } from "../constants";
import { marketAbi } from "../abis";

interface Props {
    chainName: string;
    account: Address;
    marketAddress: Address;
    tokenIn: Address[];
    amounts: string[];
    minLpOut: string;
}

/**
 * Adds liquidity to a Pendle market
 * 
 * @description
 * This function allows users to provide liquidity to a Pendle market by depositing multiple tokens.
 * It handles token approvals automatically and ensures minimum LP token output.
 * 
 * @param props - The deposit parameters
 * @param props.chainName - Name of the blockchain network
 * @param props.account - User's wallet address
 * @param props.marketAddress - Address of the Pendle market
 * @param props.tokenIn - Array of token addresses to provide as liquidity
 * @param props.amounts - Array of token amounts to provide (in decimal format)
 * @param props.minLpOut - Minimum LP tokens expected to receive
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result with success/error message
 * 
 * @example
 * ```typescript
 * const result = await addLiquidity({
 *     chainName: "ethereum",
 *     account: "0x...",
 *     marketAddress: "0x...",
 *     tokenIn: ["0x...", "0x..."],
 *     amounts: ["1.0", "1.0"],
 *     minLpOut: "0.9"
 * }, tools);
 * ```
 */
export async function addLiquidity(
    { chainName, account, marketAddress, tokenIn, amounts, minLpOut }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    if (!account) return toResult('Wallet not connected', true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId))
        return toResult(`Pendle is not supported on ${chainName}`, true);

    if (tokenIn.length !== amounts.length) 
        return toResult("Token and amount arrays must have same length", true);

    const netTokenIn = amounts.map(amount => parseUnits(amount, 18));
    const minLpOutWei = parseUnits(minLpOut, 18);

    await notify("Preparing to add liquidity...");

    const provider = getProvider(chainId);
    const transactions: TransactionParams[] = [];

    // Check and prepare approve transactions for each token
    for (let i = 0; i < tokenIn.length; i++) {
        await checkToApprove({
            args: {
                account,
                target: tokenIn[i],
                spender: marketAddress,
                amount: netTokenIn[i]
            },
            provider,
            transactions
        });
    }

    // Prepare add liquidity transaction
    const tx: TransactionParams = {
        target: marketAddress,
        data: encodeFunctionData({
            abi: marketAbi,
            functionName: "addLiquidity",
            args: [account, tokenIn, netTokenIn, minLpOutWei]
        })
    };
    transactions.push(tx);

    await notify("Waiting for transaction confirmation...");

    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(
        result.isMultisig
            ? message.message
            : `Successfully added liquidity to Pendle market. ${message.message}`
    );
} 