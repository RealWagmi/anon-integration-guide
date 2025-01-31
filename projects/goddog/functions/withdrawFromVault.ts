import { FunctionReturn, FunctionOptions, toResult, TransactionParams } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { Address, encodeFunctionData, parseAbi, parseUnits } from 'viem';
import { VaultABI } from '../abis/VaultABI';

interface Props {
    account: Address;
    vaultAddress: Address;
    shareAmount: string;
    recipient: Address;
    chainId: number;
}

/**
 * Withdraw tokens from the specific vault.
 *
 * @param props - The function parameters
 * @param props.account - Account
 * @param props.vaultAddress - Optional vault address to withdraw tokens
 * @param props.shareAmount - Share amount to withdraw
 * @param props.recipient - Receiver address to get tokens
 * @param props.chainId - Chain ID to add liquidity
 * @returns transaction Result
 */
export async function withdrawFromVault(
    { account, vaultAddress, shareAmount, recipient, chainId }: Props,
    { notify, getProvider, sendTransactions }: FunctionOptions,
): Promise<FunctionReturn> {
    try {
        // Check wallet connection
        if (!account) return toResult('Wallet not connected', true);
        if (!supportedChains.includes(chainId)) return toResult('Wallet not connected', true);
        await notify('Withdrawing from the existing vault...');

        const provider = getProvider(chainId);
        const transactions: TransactionParams[] = [];
        const _decimal = await provider.readContract({
            address: vaultAddress,
            abi: parseAbi(['function decimals() public view returns (uint256)']),
            functionName: 'decimals',
            args: [],
        });
        const amountInWei = parseUnits(shareAmount, Number(_decimal));

        // Prepare withdraw transaction
        const tx: TransactionParams = {
            target: vaultAddress,
            data: encodeFunctionData({
                abi: VaultABI,
                functionName: 'withdraw',
                args: [amountInWei, 0, 0, recipient],
            }),
        };
        transactions.push(tx);
        await notify('Waiting for transaction confirmation...');

        const result = await sendTransactions({ chainId, account, transactions });
        const returnMessage = result.data[result.data.length - 1];
        return toResult(result.isMultisig ? returnMessage.message : `Successfully Withdrawed tokens from the vault : ${vaultAddress}. ${returnMessage.message}`);
    } catch (error) {
        return toResult(`Failed to withdraw: ${error}`, true);
    }
}
