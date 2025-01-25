import { Address, isAddressEqual, PublicClient, zeroAddress } from 'viem';
import { getChainFromName } from '@heyanon/sdk';
import { ROUTER_ADDRESS, supportedChains } from '../constants';
import { routerAbi } from '../abis';

interface Props {
    chainName: string;
    token0Address: Address;
    token1Address: Address;
    publicClient: PublicClient;
}

/**
 * Checks if a pair of tokens has a stable or volatile pair on Equalizer
 * @param props - The parameters for checking pair stability
 * @param props.chainName - The name of the blockchain network
 * @param props.token0Address - The address of the first token
 * @param props.token1Address - The address of the second token
 * @param props.publicClient - The viem public client instance
 * @returns True if the pair is stable, false if volatile, null if the pair couldn't be found
 * @throws {Error} When chain is not supported or token addresses are invalid
 */
export async function isStable({ chainName, token0Address, token1Address, publicClient }: Props): Promise<boolean | null> {
    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) throw new Error(`Unsupported chain name: ${chainName}`);
    if (!supportedChains.includes(chainId)) throw new Error(`Network ${chainName} is not supported`);

    // Validate token address
    if (!token0Address || !token1Address) throw new Error('Token address is required');

    try {
        const [isStablePairResult, isVolatilePairResult] = await publicClient.multicall({
            contracts: [
                {
                    abi: routerAbi,
                    address: ROUTER_ADDRESS,
                    functionName: 'pairFor',
                    args: [token0Address, token1Address, true],
                },
                {
                    abi: routerAbi,
                    address: ROUTER_ADDRESS,
                    functionName: 'pairFor',
                    args: [token0Address, token1Address, false],
                },
            ],
        });
        const isStablePairAddress = isStablePairResult.result ?? zeroAddress;
        const isStablePair = isAddressEqual(isStablePairAddress, zeroAddress);
        const isVolatilePairAddress = isVolatilePairResult.result ?? zeroAddress;
        const isVolatilePair = isAddressEqual(isVolatilePairAddress, zeroAddress);
        // Return formatted metadata
        return isStablePair ?? isVolatilePair ?? null;
    } catch (error) {
        console.error(`Error fetching pair for ${token0Address} - ${token1Address}:`, error);
        throw new Error(`Failed to fetch pair data for tokens ${token0Address} - ${token1Address}. The contract may not be an ERC20 token.`);
    }
}
