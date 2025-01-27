// functions/addLiquidity.ts
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
import { curveStableSwapNGAbi } from "../abis/stable-swap-ng";

interface AddLiquidityProps {
    chainName: string;
    poolAddress: Address;
    amounts: string[];
    slippage: string;
    userAddress: Address;
}

/**
 * Adds liquidity to Curve StableSwapNG pool
 * @param props - The liquidity addition parameters
 * @param tools - System tools for blockchain interactions
 * @returns Transaction result
 */
export async function addLiquidity(
    { chainName, poolAddress, amounts, slippage, userAddress }: AddLiquidityProps,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    if (!userAddress) return toResult("Wallet not connected", true);

    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId))
        return toResult(`Protocol is not supported on ${chainName}`, true);

    const provider = getProvider(chainId);

    try {
        const poolContract = {
            address: poolAddress,
            abi: curveStableSwapNGAbi
        };

        // Convert amounts to BigInt array
        const amountsInWei = amounts.map(amount => parseUnits(amount, 18)); // Adjust decimals based on tokens

        // Calculate expected LP tokens
        const expectedLP = await provider.readContract({
            ...poolContract,
            functionName: "calc_token_amount",
            args: [amountsInWei, true]
        }) as bigint;

        // Calculate minimum LP tokens with slippage
        const slippageBps = parseUnits(slippage, 2);
        const minLP = (expectedLP * (10000n - slippageBps)) / 10000n;

        await notify("Preparing add liquidity transaction...");

        const transactions: TransactionParams[] = [];

        // Check and prepare approve transactions for each token
        for (let i = 0; i < amounts.length; i++) {
            if (amountsInWei[i] > 0n) {
                const tokenAddress = await provider.readContract({
                    ...poolContract,
                    functionName: "coins",
                    args: [BigInt(i)]
                }) as Address;

                await checkToApprove({
                    args: {
                        account: userAddress,
                        target: tokenAddress,
                        spender: poolAddress,
                        amount: amountsInWei[i]
                    },
                    provider,
                    transactions
                });
            }
        }

        // Prepare add liquidity transaction
        const addLiquidityTx: TransactionParams = {
            target: poolAddress,
            data: encodeFunctionData({
                abi: curveStableSwapNGAbi,
                functionName: "add_liquidity",
                args: [amountsInWei, minLP, userAddress]
            })
        };
        transactions.push(addLiquidityTx);

        await notify("Waiting for transaction confirmation...");

        const result = await sendTransactions({ chainId, account: userAddress, transactions });
        const message = result.data[result.data.length - 1];

        return toResult(
            result.isMultisig
                ? message.message
                : `Successfully added liquidity. ${message.message}`
        );
    } catch (error) {
        return toResult(`Error adding liquidity: ${error.message}`, true);
    }
}