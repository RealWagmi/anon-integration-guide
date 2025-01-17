import { stableModuleAbi } from "../abis/stableModule";

interface RedeemUnitProps {
    chainName: string;
    unitAmount: string;
    account: string;
}

export async function redeemUnit(
    { chainName, unitAmount, account }: RedeemUnitProps,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain: ${chainName}`, true);

    try {
        await notify("Preparing redeem UNIT transaction...");
        const provider = getProvider(chainId);
        const transactions = [];

        // Encode the redeem transaction
        const tx = {
            target: ADDRESSES.STABLE_MODULE,
            data: encodeFunctionData({ abi: stableModuleAbi, functionName: "redeemStable", args: [unitAmount] })
        };
        transactions.push(tx);

        // Submit transaction
        const result = await sendTransactions({ chainId, account, transactions });
        return toResult(`Successfully redeemed UNIT for rETH: ${result.data[result.data.length - 1].message}`);
    } catch (error) {
        return toResult(`Error redeeming UNIT: ${error.message}`, true);
    }
}
