import { Address, encodeFunctionData, parseUnits } from 'viem';
import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { supportedChains, wstETH_ADDRESS, stETH_ADDRESS } from '../constants';
import wstETHAbi from '../abis/wstETHAbi';
const { checkToApprove, getChainFromName } = EVM.utils;

interface Props {
    chainName: string;
    account: Address;
    amount: string;
}

/**
 * Wraps a specified amount of stETH into wstETH.
 * @param props - Wrapping parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Transaction result.
 */
export async function wrapStETH({ chainName, account, amount }: Props, options: FunctionOptions): Promise<FunctionReturn> {
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
        await notify('Checking stETH allowance for wrapping...');
        const amountInWei = parseUnits(amount, 18);
        const transactions: EVM.types.TransactionParams[] = [];
        // Check and prepare approve transaction if needed
        await checkToApprove({
            args: {
                account,
                target: stETH_ADDRESS,
                spender: wstETH_ADDRESS,
                amount: amountInWei,
            },
            provider,
            transactions,
        });

        // Prepare wrap transaction
        const wrapTx: EVM.types.TransactionParams = {
            target: wstETH_ADDRESS,
            data: encodeFunctionData({
                abi: wstETHAbi,
                functionName: 'wrap',
                args: [amountInWei],
            }),
        };
        transactions.push(wrapTx);

        await notify('Sending transaction to wrap stETH into wstETH...');

        // Sign and send transaction
        const result = await sendTransactions({ chainId, account, transactions });
        const wrapMessage = result.data[result.data.length - 1];

        return toResult(result.isMultisig ? wrapMessage.message : `Successfully wrapped ${amount} stETH to wstETH. ${wrapMessage.message}`);
    } catch (error) {
        return toResult(`Failed to wrap ETH: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}
