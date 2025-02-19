import { Address } from 'viem';
import { FunctionReturn, toResult, getChainFromName, getProvider } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { marketAbi, gaugeControllerAbi } from '../abis';

interface Props {
    chainName: string;
    marketAddress: Address;
}

/**
 * Gets information about a Pendle market including rewards
 * 
 * @description
 * This function retrieves current market information including:
 * - Market expiration status
 * - Current reward rate (PENDLE per second)
 * - Accumulated rewards
 * - Last update timestamp
 * - Incentive end time
 * 
 * @param props - The query parameters
 * @param props.chainName - Name of the blockchain network
 * @param props.marketAddress - Address of the Pendle market
 * @returns Market information including rewards and status
 * 
 * @example
 * ```typescript
 * const result = await getMarketInfo({
 *     chainName: "ethereum",
 *     marketAddress: "0x..."
 * });
 * ```
 */
export async function getMarketInfo({
    chainName,
    marketAddress
}: Props): Promise<FunctionReturn> {
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId))
        return toResult(`Pendle is not supported on ${chainName}`, true);

    const provider = getProvider(chainId);

    try {
        const marketContract = {
            address: marketAddress,
            abi: marketAbi
        };

        const isExpired = await provider.readContract({
            ...marketContract,
            functionName: 'isExpired'
        }).catch(() => {
            throw new Error('Failed to check market expiration');
        });

        const rewardData = await provider.readContract({
            address: marketAddress,
            abi: gaugeControllerAbi,
            functionName: 'rewardData',
            args: [marketAddress]
        }).catch(() => {
            throw new Error('Failed to fetch reward data');
        });

        return toResult(JSON.stringify({
            isExpired,
            pendlePerSec: rewardData.pendlePerSec.toString(),
            accumulatedPendle: rewardData.accumulatedPendle.toString(),
            lastUpdated: rewardData.lastUpdated.toString(),
            incentiveEndsAt: rewardData.incentiveEndsAt.toString()
        }));
    } catch (error) {
        return toResult(`Error fetching market info: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
} 