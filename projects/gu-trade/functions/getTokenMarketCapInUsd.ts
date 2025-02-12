import { Address, formatUnits, isAddress } from 'viem';
import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { ETH_USD_ORACLE_ADDRESS, supportedChains } from '../constants';
import { ethOracleAbi, guCoinAbi } from '../abis';
import { getTokenAddress } from './getTokenAddress';

interface Props {
    chainName: string;
    token: Address | string;
}

/**
 * Fetch current token market cap in USD.
 * @param props - The request parameters.
 * @param tools - System tools for blockchain interactions.
 * @returns Token market cap.
 */
export async function getTokenMarketCapInUsd({ chainName, token }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Gu is not supported on ${chainName}`, true);

    // If token is a string, resolve it to an address
    if (!isAddress(token)) {
        const resolvedToken = await getTokenAddress({ symbol: token });
        if (!resolvedToken.success) return toResult(`Couldn't find token address for "${token}". Try again.`, true);
        token = resolvedToken.data;
    }

    const publicClient = getProvider(chainId);

    const mcap = await publicClient.readContract({
        address: token as Address,
        abi: guCoinAbi,
        functionName: 'reserveBalance',
    }) as bigint;

    const ethPrice = await publicClient.readContract({
        address: ETH_USD_ORACLE_ADDRESS,
        abi: ethOracleAbi,
        functionName: 'latestAnswer',
    }) as bigint;

    const mcapInEth = parseFloat(formatUnits(mcap, 18)); 
    const ethPriceInUsd = parseFloat(formatUnits(ethPrice, 8)); 

    const mcapInUsd = mcapInEth * ethPriceInUsd;

    return toResult(`Current Market Cap: $${mcapInUsd.toFixed(0)} USD`);
}