import { FunctionReturn, FunctionOptions, toResult, TransactionParams, checkToApprove } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { Address, encodeFunctionData, parseAbi, parseUnits } from 'viem';
import { VaultABI } from '../abis/VaultABI';

interface Props {
    account: Address;
    vaultAddress: Address;
    amount0: string;
    amount1: string;
    recipient: Address;
    chainId: number;
}

/**
 * Deposit tokens to the specific vault.
 *
 * @param props - The function parameters
 * @param props.account - Account
 * @param props.vaultAddress - Optional vault address to deposit tokens
 * @param props.amount0 - Token0 amount to deposit
 * @param props.amount1 - Token1 amount to deposit
 * @param props.recipient - Receiver address to get share
 * @param props.chainId - Chain ID to add liquidity
 * @returns transaction Result
 */
export async function depositToVault(
    { account, vaultAddress, amount0, amount1, recipient, chainId }: Props,
    { notify, getProvider, sendTransactions }: FunctionOptions,
): Promise<FunctionReturn> {
    try {
        // Check wallet connection
        if (!account) return toResult('Wallet not connected', true);
        if (!supportedChains.includes(chainId)) return toResult('Wallet not connected', true);
        await notify('Depositing to the existing vault...');

        const provider = getProvider(chainId);
        const transactions: TransactionParams[] = [];
        const token0 = await provider.readContract({
            address: vaultAddress,
            abi: VaultABI,
            functionName: 'token0',
            args: [],
        });
        const token1 = await provider.readContract({
            address: vaultAddress,
            abi: VaultABI,
            functionName: 'token1',
            args: [],
        });
        const _decimal0 = await provider.readContract({
            address: token0 as Address,
            abi: parseAbi(['function decimals() public view returns (uint256)']),
            functionName: 'decimals',
            args: [],
        });
        const amount0InWei = parseUnits(amount0, Number(_decimal0));
        const _decimal1 = await provider.readContract({
            address: token1 as Address,
            abi: parseAbi(['function decimals() public view returns (uint256)']),
            functionName: 'decimals',
            args: [],
        });
        const amount1InWei = parseUnits(amount1, Number(_decimal1));
        await notify('Checking approve...');
        await checkToApprove({
            args: {
                account,
                target: token0 as Address,
                spender: vaultAddress,
                amount: amount0InWei,
            },
            provider,
            transactions,
        });
        await checkToApprove({
            args: {
                account,
                target: token1 as Address,
                spender: vaultAddress,
                amount: amount1InWei,
            },
            provider,
            transactions,
        });

        // Prepare deposit transaction
        const tx: TransactionParams = {
            target: vaultAddress,
            data: encodeFunctionData({
                abi: VaultABI,
                functionName: 'deposit',
                args: [amount0InWei, amount1InWei, 0, 0, recipient],
            }),
        };
        transactions.push(tx);
        await notify('Waiting for transaction confirmation...');

        const result = await sendTransactions({ chainId, account, transactions });
        const returnMessage = result.data[result.data.length - 1];
        return toResult(result.isMultisig ? returnMessage.message : `Successfully deposited tokens to the vault : ${vaultAddress}. ${returnMessage.message}`);
    } catch (error) {
        return toResult(`Failed to withdraw: ${error}`, true);
    }
}
