import { Address, erc20Abi, PublicClient } from 'viem';
import { getChainFromName } from '@heyanon/sdk';
import { supportedChains, SILVER_FEES_ADDRESS } from '../constants';
import { silverFeesAbi } from '../abis';

interface Props {
	chainName: string;
	poolToSteal: Address;
	publicClient: PublicClient;
}

interface SnatchData {
	user: string;
	bidAmount: bigint;
	poolToSteal: string;
}

/**
 * Retrieves data from Snatch with a pool address.
 * @param props - The query parameters including chain and token address.
 * @returns Snatch data information.
 */
export async function getSnatchData({ chainName, poolToSteal, publicClient }: Props): Promise<SnatchData> {
	// Validate chain
	const chainId = getChainFromName(chainName);
	if (!chainId) throw new Error(`Unsupported chain name: ${chainName}`);
	if (!supportedChains.includes(chainId)) throw new Error(`Network ${chainName} is not supported`);

	// Validate token address
	if (!poolToSteal) throw new Error('Pool address is required');

	try {
		// Fetch data from Snatch for the poolToSteal
		const data = await publicClient.readContract({
			address: SILVER_FEES_ADDRESS,
			abi: silverFeesAbi,
			functionName: 'snatchData',
			args: [poolToSteal],
		});

		// Parse the data
		const snatchData: SnatchData = {
			user: data[0].user.toString(),
			bidAmount: data[0].bidAmount,
			poolToSteal: poolToSteal.toString(),
		}
		
		return snatchData;
	} catch (error) {
		console.error('Error fetching snatch info:', error);
		throw new Error(`Failed to fetch snatch for pool ${poolToSteal}.`);
	}
}