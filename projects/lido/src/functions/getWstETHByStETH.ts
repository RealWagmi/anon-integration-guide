import { formatUnits, Address, parseEther } from 'viem';
import { supportedChains, wstETH_ADDRESS } from '../constants';
import wstETHAbi from '../abis/wstETHAbi';
import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
const { getChainFromName } = EVM.utils;

interface StEthInfoProps {
    chainName: string;
    account: Address;
    amount: string;
}

/**
 * Converts stETH to wstETH value.
 */
export async function getWstETHByStETH({ chainName, amount }: StEthInfoProps, options: FunctionOptions): Promise<FunctionReturn> {
    const {
        evm: { getProvider },
    } = options;

    try {
        if (!amount || typeof amount !== 'string' || isNaN(Number(amount)) || Number(amount) <= 0) {
            return toResult('Amount must be a valid number greater than 0', true);
        }

        // Validate chainName input
        if (!chainName || typeof chainName !== 'string') {
            return toResult('Chain name must be a non-empty string', true);
        }

        // Get the chain ID from the chain name
        const chainId = getChainFromName(chainName as EvmChain);
        if (!chainId) {
            return toResult(`Unsupported chain name: ${chainName}`, true);
        }

        // Check if the chain is supported by the protocol
        if (!supportedChains.includes(chainId)) {
            return toResult(`Lido protocol is not supported on ${chainName}`, true);
        }

        // Get the provider (public client) for the specified chain
        const publicClient = getProvider(chainId);
        if (!publicClient) {
            return toResult(`Failed to get provider for chain: ${chainName}`, true);
        }

        const amountInWei = parseEther(amount);
        const wstEthAmount = (await publicClient.readContract({
            address: wstETH_ADDRESS,
            abi: wstETHAbi,
            functionName: 'getWstETHByStETH',
            args: [amountInWei],
        })) as bigint;

        return toResult(`Equivalent wstETH: ${formatUnits(wstEthAmount, 18)} wstETH`);
    } catch (error) {
        return toResult(`Failed to convert stETH to wstETH: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}
