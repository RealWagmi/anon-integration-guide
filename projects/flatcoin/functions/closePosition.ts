interface ClosePositionProps {
    chainName: string;
    positionId: string;
    account: string;
}

export async function closePosition(
    { chainName, positionId, account }: ClosePositionProps,
    { sendTransactions, notify, getProvider }: FunctionOptions
): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain: ${chainName}`, true);

    try {
        await notify("Preparing close position transaction...");
        const provider = getProvider(chainId);
        const transactions = [];

        // Encode the close position transaction
        const tx = {
            target: ADDRESSES.LEVERAGE_MODULE,
            data: encodeFunctionData({ abi: leverageModuleAbi, functionName: "closePosition", args: [positionId] })
        };
        transactions.push(tx);

        // Submit transaction
        const result = await sendTransactions({ chainId, account, transactions });
        return toResult(`Successfully closed position: ${result.data[result.data.length - 1].message}`);
    } catch (error) {
        return toResult(`Error closing position: ${error.message}`, true);
    }
}