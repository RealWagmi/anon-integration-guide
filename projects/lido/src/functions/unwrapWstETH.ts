import { Address, encodeFunctionData, parseEther } from 'viem';
import { supportedChains, wstETH_ADDRESS } from '../constants';
import wstETHAbi from '../abis/wstETHAbi';
import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
const { getChainFromName } = EVM.utils;

interface StEthInfoProps {
    chainName: string;
    account: Address;
    amount: string; // Amount to wrap/unwrap
}

/**
 * Unwraps wstETH back into stETH.
 */
export async function unwrapWstETH({ chainName, account, amount }: StEthInfoProps, options: FunctionOptions): Promise<FunctionReturn> {
    const {
        evm: { sendTransactions },
        notify,
    } = options;

    if (!account) return toResult('Wallet not connected', true);

    //validate amount
    if (!amount || typeof amount !== 'string' || isNaN(Number(amount)) || Number(amount) <= 0) {
        return toResult('Amount must be a valid number greater than 0', true);
    }
    // Validate chain
    const chainId = getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Lido protocol is not supported on ${chainName}`, true);

    try {
        await notify(`Unwrapping ${amount} wstETH to stETH...`);
        const amountInWei = parseEther(amount);

        const tx: EVM.types.TransactionParams = {
            target: wstETH_ADDRESS as `0x${string}`,
            data: encodeFunctionData({
                abi: wstETHAbi,
                functionName: 'unwrap',
                args: [amountInWei],
            }),
        };

        const result = await sendTransactions({
            chainId,
            account,
            transactions: [tx],
        });
        return toResult(`Successfully unwrapped ${amount} wstETH to stETH. Transaction Hash: ${result?.data?.[0]?.hash || 'Unknown'}`);
    } catch (error) {
        return toResult(`Failed to unwrap wstETH: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}
