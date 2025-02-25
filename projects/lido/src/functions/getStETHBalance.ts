import { Address, formatUnits } from 'viem';
import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
import { supportedChains, stETH_ADDRESS } from '../constants';
import stEthAbi from '../abis/stEthAbi';
const { getChainFromName } = EVM.utils;

// Define the interface for the function props
interface Props {
    chainName: string; // Name of the blockchain network (e.g., "Ethereum")
    account: Address; // User's wallet address
}

/**
 * Fetches the stETH balance for a given account on the Lido protocol.
 * @param {Props} params - An object containing the chain name and account address.
 * @param {FunctionOptions} options - An object containing the `getProvider` function to interact with the blockchain.
 * @returns {Promise<FunctionReturn>} - A promise that resolves to the stETH balance or an error message.
 */
export async function getStETHBalance({ chainName, account }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const {
        evm: { getProvider },
    } = options;
    try {
        if (!account) return toResult('Wallet not connected', true);

        // Get the chain ID from the chain name
        const chainId = getChainFromName(chainName as EvmChain);
        if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);

        // Check if the chain is supported by the protocol
        if (!supportedChains.includes(chainId)) {
            return toResult(`Lido protocol is not supported on ${chainName}`, true);
        }

        // Get the provider (public client) for the specified chain
        const publicClient = getProvider(chainId);
        if (!publicClient) {
            return toResult(`Failed to get provider for chain: ${chainName}`, true);
        }

        // Read the stETH balance from the Lido contract
        const balance = await publicClient.readContract({
            address: stETH_ADDRESS, // Address of the Lido stETH contract
            abi: stEthAbi, // ABI of the Lido stEth contract
            functionName: 'balanceOf', // Function to call
            args: [account], // Arguments for the function (user's wallet address)
        });

        // Assert the balance as a bigint (since readContract returns unknown)
        const balanceBigInt = balance as bigint;

        // Format the balance from wei to stETH (18 decimal places) and return the result
        return toResult(`stETH balance: ${formatUnits(balanceBigInt, 18)} stETH`);
    } catch (error) {
        // Handle any errors that occur during the contract call
        return toResult(`Failed to get stETH balance: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
}
