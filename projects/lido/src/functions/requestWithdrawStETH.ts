import { Address, encodeFunctionData, parseUnits } from 'viem';
import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { supportedChains, LIDO_WITHDRAWAL_ADDRESS, stETH_ADDRESS } from '../constants';
import withdrawalAbi from '../abis/withdrawalAbi';
const { checkToApprove, getChainFromName } = EVM.utils;

interface WithdrawProps {
    chainName: string;
    account: Address;
    amount: string;
}

/**
 * Requests a withdrawal of stETH from the Lido protocol.
 * @param props - Withdrawal parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Transaction result.
 */
export async function requestWithdrawStETH({ chainName, account, amount }: WithdrawProps, options: FunctionOptions): Promise<FunctionReturn> {
    const {
        evm: { getProvider, sendTransactions },
        notify,
    } = options;

    if (!account) return toResult('Wallet not connected', true);

    // Validate amount
    if (!amount || typeof amount !== 'string' || isNaN(Number(amount)) || Number(amount) <= 0) {
        return toResult('Amount must be a valid number greater than 0', true);
    }
    // Validate chain
    const chainId = getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Lido protocol is not supported on ${chainName}`, true);

    const provider = getProvider(chainId);
    if (!provider) {
        return toResult(`Failed to get provider for chain: ${chainName}`, true);
    }

    try {
        const amountInWei = parseUnits(amount, 18);
        await notify('Checking stETH allowance for withdrawal...');

        const transactions: EVM.types.TransactionParams[] = [];

        // Check and prepare approve transaction if needed
        await checkToApprove({
            args: {
                account,
                target: stETH_ADDRESS,
                spender: LIDO_WITHDRAWAL_ADDRESS,
                amount: amountInWei,
            },
            provider,
            transactions,
        });

        // Prepare withdrawal transaction
        const withdrawTx: EVM.types.TransactionParams = {
            target: LIDO_WITHDRAWAL_ADDRESS,
            data: encodeFunctionData({
                abi: withdrawalAbi,
                functionName: 'requestWithdrawals',
                args: [[amountInWei], account],
            }),
        };
        transactions.push(withdrawTx);

        await notify('Sending transaction to request stETH withdrawal...');

        // Sign and send transaction
        const result = await sendTransactions({ chainId, account, transactions });
        const withdrawMessage = result.data[result.data.length - 1];

        return toResult(result.isMultisig ? withdrawMessage.message : `Withdrawal request of ${amount} stETH submitted. ${withdrawMessage.message}`);
    } catch (error) {
        return toResult(`Failed to request withdrawal for ETH: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}
