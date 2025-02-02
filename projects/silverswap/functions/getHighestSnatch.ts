import { Address } from "viem";
import { 
  FunctionReturn, 
  toResult, 
  getChainFromName
} from "@heyanon/sdk";
import { supportedChains } from '../constants';
import { getSnatchData } from '../lib/getSnatchData';

interface Props {
  chainName: string;
  poolToSteal: Address;
}

/**
 * Retrieves the highest current Snatch bid for a pool.
 * @param props - The query parameters.
 * @returns The highest current Snatch bid for a pool.
 */
export async function getHighestSnatch(
	{
  		chainName,
  		poolToSteal,
	}: Props,
	{ getProvider }): Promise<FunctionReturn> {
	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) throw new Error(`Network ${chainName} is not supported`);

	// Validate pool address
	if (!poolToSteal) {
		return toResult("Pool address is required", true);
	}

	const provider = getProvider(chainId);

	// Fetch Snatch data
	const data = await getSnatchData({ chainName, poolToSteal, publicClient: provider });

	if (!data) {
		return toResult("No Snatch data found", true);
	}

	// Get the highest Snatch
	const highestBid = data.bidAmount.toString();

	// Limit data to 500 tokens
	const limitedData = highestBid.slice(0, 500);

	return toResult(JSON.stringify(limitedData));
}