import {
  FunctionReturn,
  toResult,
  getChainFromName,
} from '@heyanon/sdk';
import { fetchLidoAPRApiUrl, supportedChains } from '../constants';


/**
 * Fetches the latest Lido APR from the official Lido API.
 */
export async function getLidoAPR(
  { chainName }: { chainName: string }
): Promise<FunctionReturn> {
  const chainId = getChainFromName(chainName);
  if (!chainId || !supportedChains.includes(chainId)) {
    return toResult(`Lido protocol is not supported on ${chainName}`, true);
  }

  try {
    const response = await fetch(fetchLidoAPRApiUrl);
    if (!response.ok) {
      return toResult(`Failed to fetch Lido APR: ${response.statusText}`, true);
    }
    
    const data = await response.json();
    const apr = data?.data?.apr;
    
    return toResult(`Current Lido APR: ${apr.toFixed(2)}%`);
  } catch (error) {
    return toResult(
      `Failed to fetch Lido APR: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      true
    );
  }
}
