import { leverageModuleAbi } from "../abis/leverageModule";

interface OpenLongPositionProps {
    chainName: string;
    collateralAmount: string;
    leverage: string;
    account: string;
}

export async function openLongPosition(
    { chainName, collateralAmount, leverage, account }: OpenLongPositionProps,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain: ${chainName}`, true);

    try {
        await notify("Preparing open long position transaction...");
        const provider = getProvider(chainId);
        const transactions = [];

        // Approve rETH if needed
        await checkToApprove({
            args: { account, target: ADDRESSES.RETH_TOKEN, spender: ADDRESSES.LEVERAGE_MODULE, amount: collateralAmount },
            provider,
            transactions
        });

        // Encode the open position transaction
        const tx = {
            target: ADDRESSES.LEVERAGE_MODULE,
            data: encodeFunctionData({ abi: leverageModuleAbi, functionName: "openPosition", args: [collateralAmount, leverage] })
        };
        transactions.push(tx);

        // Submit transaction
        const result = await sendTransactions({ chainId, account, transactions });
        return toResult(`Successfully opened long position: ${result.data[result.data.length - 1].message}`);
    } catch (error) {
        return toResult(`Error opening long position: ${error.message}`, true);
    }
}
