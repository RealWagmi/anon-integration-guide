
import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName } from '@heyanon/sdk';
import { supportedChains, VAULTS } from '../constants';
import contractAbi from '../abis/copra-finance.json';

interface Props {
    chainName: string;
    account: Address;
    shareAmount: bigint;
    data: string;
    vaultName: string;
}

/**
 * withdrawBorrower function for copra-finance
 * @param props Function parameters
 * @param tools Blockchain interaction tools
 */
export async function withdrawBorrower(
    { chainName, account, shareAmount, data, vaultName }: Props,
    { sendTransactions, notify }: FunctionOptions
): Promise<FunctionReturn> {
    // Validate wallet connection
    if (!account) return toResult("Wallet not connected", true);

    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId))
        return toResult(`Protocol is not supported on ${chainName}`, true);

    await notify("Preparing transaction...");

    const transactions: TransactionParams[] = [];

    // Prepare transaction
    const tx: TransactionParams = {
        target: VAULTS[chainId].find(vault => vault.name === vaultName)?.address as `0x${string}`,
        data: encodeFunctionData({
            abi: contractAbi,
            functionName: "withdrawBorrower",
            args: [shareAmount, data],
        }),
    };
    transactions.push(tx);

    await notify("Waiting for transaction confirmation...");

    // Sign and send transaction
    const result = await sendTransactions({ chainId, account, transactions });
    const message = result.data[result.data.length - 1];

    return toResult(
        result.isMultisig
            ? message.message
            : `Successfully executed withdrawBorrower. ${message.message}`
    );
}