
import { Address, encodeFunctionData } from 'viem';
import { FunctionReturn, FunctionOptions, TransactionParams, toResult, getChainFromName, checkToApprove } from '@heyanon/sdk';
import { supportedChains, TOKEN_ADDRESSES, VAULTS } from '../constants';
import contractAbi from '../abis/copra-finance.json';

interface Props {
    chainName: string;
    account: Address;
    depositAmount: bigint;
    vaultName: string;
}

/**
 * depositBorrower function for copra-finance
 * @param props Function parameters
 * @param tools Blockchain interaction tools
 */
export async function depositBorrower(
    { chainName, account, depositAmount, vaultName }: Props,
    { sendTransactions, notify, getProvider }: FunctionOptions
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

    // Check and prepare approve transaction if needed
    await checkToApprove({
        args: {
            account,
            target: TOKEN_ADDRESSES[vaultName],
            spender: VAULTS[chainId].find(vault => vault.name === vaultName)?.address as `0x${string}`,
            amount: depositAmount
        },
        provider: getProvider(chainId),
        transactions
    });

    // Prepare transaction
    const tx: TransactionParams = {
        target: VAULTS[chainId].find(vault => vault.name === vaultName)?.address as `0x${string}`,
        data: encodeFunctionData({
            abi: contractAbi,
            functionName: "depositBorrower",
            args: [depositAmount],
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
            : `Successfully executed depositBorrower. ${message.message}`
    );
}