import {
    Address,
    encodeFunctionData, parseUnits,
} from "viem";
import {
    FunctionReturn,
    FunctionOptions,
    TransactionParams,
    toResult, checkToApprove, getChainFromName,
} from "@heyanon/sdk";
import {validateWallet} from "../utils";
import {supportedChains, XVS_STAKE_ADDRESS} from "../constants";
import {XVSVaultAbi} from "../abis/XVSVaultAbi";

interface Props {
    chainName: string;
    account: Address;
    amount: string;
    pid: bigint;
}

/**
 * Deposit/Supply Token to Venus protocol.
 *
 * @param props - Deposit/Supply parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Borrow result containing the transaction hash.
 */
export async function unstakeXVS(
    {chainName, account, amount, pid}: Props,
    {sendTransactions, notify, getProvider}: FunctionOptions
): Promise<FunctionReturn> {
    const wallet = validateWallet({account})
    if (!wallet.success) {
        return toResult(wallet.errorMessage, true);
    }
    if (!amount || typeof amount !== 'string') {
        return toResult('Invalid amount', true);
    }
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (supportedChains.indexOf(chainId) === -1) return toResult(`Venus protocol is not supported on ${chainName}`, true);
    const provider = getProvider(chainId);
    try {
        await notify("Preparing to unStake Token...");
        const transactions: TransactionParams[] = [];
        const unstakeTx: TransactionParams = {
            target: XVS_STAKE_ADDRESS,
            data: encodeFunctionData({
                abi: XVSVaultAbi,
                functionName: "requestWithdrawal",
                args: ["0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63", pid, parseUnits(amount, 18)]
            }),
        };
        transactions.push(unstakeTx);
        // Send transactions (to mint)
        const result = await sendTransactions({
            chainId: chainId,
            account,
            transactions: transactions
        });
        const message = result.data[result.data.length - 1];
        return toResult(result.isMultisig ? message.message : `Successfully unstaked ${amount} XVS.`);
    } catch (error) {
        return toResult(
            `Failed to mint token: ${error instanceof Error ? error.message : "Unknown error"}`,
            true
        );
    }
}
