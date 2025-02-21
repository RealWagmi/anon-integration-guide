import { FunctionReturn, FunctionOptions, toResult, TransactionParams, checkToApprove } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { Address, encodeFunctionData, parseAbi, parseUnits } from 'viem';
import { VaultABI } from '../abis/VaultABI';

interface Props {
    account: Address;
    vaultAddress: Address;
    chainId: number;
}

/**
 * Rebalance on the specific vault.
 *
 * @param props - The function parameters
 * @param props.account - Account
 * @param props.vaultAddress - Optional vault address to rebalance
 * @param props.chainId - Chain ID to add liquidity
 * @returns transaction Result
 */
export async function rebalance(
    { account, vaultAddress, chainId }: Props,
    { notify, getProvider, sendTransactions }: FunctionOptions,
): Promise<FunctionReturn> {
    try {
        // Check wallet connection
        if (!account) return toResult('Wallet not connected', true);
        if (!supportedChains.includes(chainId)) return toResult('Wallet not connected', true);
        await notify('Depositing to the existing vault...');

        const provider = getProvider(chainId);
        const transactions: TransactionParams[] = [];
        const _account = await provider.readContract({
            address: vaultAddress,
            abi: VaultABI,
            functionName: 'rebalanceDelegate',
            args: [],
        });
        if(String(_account) !== String(account)) {
            return toResult('This acc has no permission to call this function', true);
        }
        // Prepare deposit transaction
        const tx: TransactionParams = {
            target: vaultAddress,
            data: encodeFunctionData({
                abi: VaultABI,
                functionName: 'rebalance',
                args: [],
            }),
        };
        transactions.push(tx);
        await notify('Waiting for transaction confirmation...');

        const result = await sendTransactions({ chainId, account, transactions });
        const returnMessage = result.data[result.data.length - 1];
        return toResult(result.isMultisig ? returnMessage.message : `Successfully called rebalance on the vault : ${vaultAddress}. ${returnMessage.message}`);
    } catch (error) {
        return toResult(`Failed to withdraw: ${error}`, true);
    }
}
