import { Address, erc20Abi, PublicClient } from 'viem';
import { getChainFromName } from '@heyanon/sdk';
import { supportedChains, SILVER_FEES_ADDRESS } from '../constants';
import { silverFeesAbi } from '../abis';

interface Props {
	chainName: string;
	publicClient: PublicClient;
}

interface FlareData {
	user: string;
	bidAmount: bigint;
	buybackToken: string;
}

/**
 * Retrieves data from Flare.
 * @param props - The query parameters including chain and token address.
 * @returns Flare data information.
 */
export async function getFlareData({ chainName, publicClient }: Props): Promise<FlareData> {
	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) throw new Error(`Unsupported chain name: ${chainName}`);
	if (!supportedChains.includes(chainId)) throw new Error(`Network ${chainName} is not supported`);

	try {
		// Fetch data from Flare for the buybackToken
		const data = await publicClient.readContract({
			address: SILVER_FEES_ADDRESS,
			abi: silverFeesAbi,
			functionName: 'flareData',
		});

		// Parse the data
		const flareData: FlareData = {
			user: data[0].toString(),
			bidAmount: data[1],
			buybackToken: data[2].toString(),
		}
		
		return flareData;
	} catch (error) {
		console.error('Error fetching flare info:', error);
		throw new Error(`Failed to fetch flare info.`);
	}
}