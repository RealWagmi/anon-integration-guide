import {
  FunctionReturn,
  FunctionOptions,
  toResult,
  getChainFromName,
} from '@heyanon/sdk';
import { supportedChains, stETH_ADDRESS } from '../constants';
import stEthAbi from '../abis/stEthAbi';

interface Props {
  chainName: string; // Name of the blockchain network (e.g., "Ethereum")
}

/**
 * Fetches the total amount of ETH staked in the Lido protocol.
 * @param {Props} args - An object containing the chain name.
 * @param {FunctionOptions} options - An object containing `getProvider` and `notify` utilities.
 * @returns {Promise<FunctionReturn>} - A promise that resolves to the total staked ETH or an error message.
 */
export async function getTotalStaked(
  { chainName }: Props,
  { getProvider, notify }: FunctionOptions
): Promise<FunctionReturn> {
  // Get the chain ID from the chain name
  const chainId = getChainFromName(chainName);
  if (!chainId) {
    return toResult(`Unsupported chain name: ${chainName}`, true);
  }

  // Check if the chain is supported by the protocol
  if (!supportedChains.includes(chainId)) {
    return toResult(`Lido protocol is not supported on ${chainName}`, true);
  }

  try {
    // Notify the user that the process is starting
    await notify('Fetching total staked ETH in Lido...');

    // Get the provider (public client) for the specified chain
    const publicClient = getProvider(chainId);

    // Read the total staked ETH from the Lido contract
    const totalStaked = await publicClient.readContract({
      address: stETH_ADDRESS,
      abi: stEthAbi,
      functionName: 'getTotalPooledEther',
    });

    // Convert the total staked amount from wei to ETH
    const totalStakedInETH = Number(totalStaked) / 1e18;

    // Return the total staked amount as a string
    return toResult(totalStakedInETH.toString());
  } catch (error) {
    // Handle any errors that occur during the process
    return toResult(
      `Failed to fetch total staked ETH: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      true
    );
  }
}
