import { Address, formatUnits } from 'viem';
import { supportedChains, wstETH_ADDRESS } from '../constants';
import wstETHAbi from '../abis/wstETHAbi';
import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
const { getChainFromName } = EVM.utils;

interface StEthInfoProps {
    chainName: string;
    account: Address;
}

/**
 * Fetches the user's wstETH balance.
 */
export async function getWstETHBalance({ chainName, account }: StEthInfoProps, options: FunctionOptions): Promise<FunctionReturn> {
    const {
        evm: { getProvider },
    } = options;

    try {
        if (!account) return toResult('Wallet not connected', true);

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

        const balance = (await publicClient.readContract({
            address: wstETH_ADDRESS,
            abi: wstETHAbi,
            functionName: 'balanceOf',
            args: [account],
        })) as bigint;

        return toResult(`wstETH Balance: ${formatUnits(balance, 18)} wstETH`);
    } catch (error) {
        return toResult(`Failed to fetch wstETH balance: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}
