import {
    Address,
    encodeFunctionData, parseUnits,
} from "viem";
import {
    FunctionReturn,
    FunctionOptions,
    TransactionParams,
    toResult, checkToApprove,
} from "@heyanon/sdk";
import {vBNBAbi} from "../abis/vBNBAbi";
import {vTokenAbi} from "../abis/vTokenAbi";
import {validateWallet, validateAndGetTokenDetails} from "../utils";

interface Props {
    chainName: string;
    account: Address;
    amount: string;
    tokenSymbol: string;
    pool: string;
}

/**
 * Deposit/Supply Token to Venus protocol.
 *
 * @param props - Deposit/Supply parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Borrow result containing the transaction hash.
 */
export async function mintToken(
    {chainName, account, amount, tokenSymbol, pool}: Props,
    {sendTransactions, notify, getProvider}: FunctionOptions
): Promise<FunctionReturn> {
    const wallet = validateWallet({account})
    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }
    if (!amount || typeof amount !== 'string') {
        return toResult('Invalid amount', true);
    }
    const tokenDetails = validateAndGetTokenDetails({chainName, pool, tokenSymbol: tokenSymbol})
    if (!tokenDetails.success) {
        return toResult(tokenDetails.errorMessage, true);
    }
    const provider = getProvider(tokenDetails.data.chainId);
    try {
        await notify("Preparing to mint Token...");
        const transactions: TransactionParams[] = [];
        // Prepare mint transaction
        if (tokenDetails.data.isChainBased) {
            const mintTx: TransactionParams = {
                target: tokenDetails.data.tokenAddress,
                data: encodeFunctionData({
                    abi: vBNBAbi,
                    functionName: "mint",
                    args: []
                }),
                value: parseUnits(amount, tokenDetails.data.tokenDecimals),
            };
            transactions.push(mintTx);
        } else {
            const underlyingAssetAddress = await provider.readContract({
                abi: vTokenAbi,
                address: tokenDetails.data.tokenAddress,
                functionName: 'underlying',
                args: [],
            });
            console.log(underlyingAssetAddress)
            await checkToApprove({
                args: {
                    account,
                    target: underlyingAssetAddress,
                    spender: tokenDetails.data.tokenAddress,
                    amount: parseUnits(amount, tokenDetails.data.tokenDecimals),
                },
                provider,
                transactions
            });
            const mintTx: TransactionParams = {
                target: tokenDetails.data.tokenAddress,
                data: encodeFunctionData({
                    abi: vTokenAbi,
                    functionName: "mint",
                    args: [parseUnits(amount, tokenDetails.data.tokenDecimals)]
                }),
            };
            transactions.push(mintTx);
        }
        // Send transactions (to mint)
        const result = await sendTransactions({
            chainId: tokenDetails.data.chainId,
            account,
            transactions: transactions
        });
        const depositMessage = result.data[result.data.length - 1];
        return toResult(result.isMultisig ? depositMessage.message : `Successfully deposited ${amount} ${tokenSymbol}.`);
    } catch (error) {
        return toResult(
            `Failed to mint token: ${error instanceof Error ? error.message : "Unknown error"}`,
            true
        );
    }
}
