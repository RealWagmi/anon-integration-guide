import { Address } from "viem";
import { 
  FunctionReturn, 
  toResult, 
  getChainFromName
} from "@heyanon/sdk";
import { supportedChains } from '../constants';
import { getFlareData } from '../lib/getFlareData';

interface Props {
  chainName: string;
}

/**
 * Retrieves the highest current Flare bid.
 * @param props - The query parameters.
 * @returns The highest current Flare bid.
 */
export async function getHighestFlare(
	{
  		chainName,
	}: Props,
	{ getProvider }): Promise<FunctionReturn> {
	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
	if (!supportedChains.includes(chainId)) throw new Error(`Network ${chainName} is not supported`);

	// Get provider
	const provider = getProvider(chainId);

	// Fetch Flare data
	const data = await getFlareData({ chainName, publicClient: provider });

	if (!data) {
		return toResult("No Flare data found", true);
	}

	// Get the highest Flare
	const highestBid = data.bidAmount.toString();

	// Limit data to 500 tokens
	const limitedData = highestBid.slice(0, 500);

	return toResult(JSON.stringify(limitedData));
}