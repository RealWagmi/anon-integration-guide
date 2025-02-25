import { supportedChains, stETH_ADDRESS } from '../constants';
import stEthAbi from '../abis/stEthAbi';
import { formatUnits } from 'viem';
import { EVM, EvmChain, FunctionOptions, FunctionReturn, toResult } from '@heyanon/sdk';
const { getChainFromName } = EVM.utils;

interface Props {
    chainName: string;
}

/**
 * Fetches the total amount of ETH staked in the Lido protocol.
 * @param {Props} args - An object containing the chain name.
 * @param {FunctionOptions} options - An object containing `getProvider` and `notify` utilities.
 * @returns {Promise<FunctionReturn>} - A promise that resolves to the total staked ETH or an error message.
 */
export async function getTotalStaked({ chainName }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const {
        evm: { getProvider },
        notify,
    } = options;

    try {
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

        // Notify the user that the process is starting
        await notify('Fetching total staked ETH in Lido...');

        // Get the provider (public client) for the specified chain
        const publicClient = getProvider(chainId);
        if (!publicClient) {
            return toResult(`Failed to get provider for chain: ${chainName}`, true);
        }

        // Read the total staked ETH from the Lido contract
        const totalStakedBigInt = (await publicClient.readContract({
            address: stETH_ADDRESS,
            abi: stEthAbi,
            functionName: 'getTotalPooledEther',
        })) as bigint;

        // Convert the bigint value to a formatted string using formatUnits
        const formattedTotal = formatUnits(totalStakedBigInt, 18);

        // Additional validation to ensure we have a valid number
        if (formattedTotal === '' || isNaN(Number(formattedTotal))) {
            return toResult('Failed to format staked amount to a valid number', true);
        }

        return toResult(`Total Staked amount is : ${formattedTotal}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';

        return toResult(`Failed to fetch total staked ETH: ${errorMessage}`, true);
    }
}
