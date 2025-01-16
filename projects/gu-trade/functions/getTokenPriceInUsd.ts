import { Address, formatUnits } from 'viem';
import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { ETH_USD_ORACLE_ADDRESS, supportedChains } from '../constants';
import { ethOracleAbi, guCoinAbi } from '../abis';
import { getTokenAddress } from './getTokenAddress';

interface Props {
    chainName: string;
    account: Address;
    token: Address | string;
}

/**
 * Fetch current token price in USD.
 * @param props - The request parameters.
 * @param tools - System tools for blockchain interactions. 
 * @returns Token price.
 */
export async function getTokenPriceInUsd({ chainName, token }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
    // Validate chain
    const chainId = getChainFromName(chainName);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Gu is not supported on ${chainName}`, true);

    // If token is a string, resolve it to an address
    if (typeof token === 'string') {
        const resolvedToken = await getTokenAddress({ input: token });
        if (!resolvedToken.success) return toResult(`Couldn't find token address for "${token}". Try again.`, true);
        token = resolvedToken.data as Address;
    }

    const publicClient = getProvider(chainId);

    const tokenPrice = await publicClient.readContract({
        address: `0x${token}`,
        abi: guCoinAbi,
        functionName: 'price',
        args: [],
    }) as bigint;

    const ethPrice = await publicClient.readContract({
        address: ETH_USD_ORACLE_ADDRESS,
        abi: ethOracleAbi,
        functionName: 'latestAnswer',
        args: [],
    }) as bigint;

    // Convert price to proper format
    const tokenPriceInEth = parseFloat(formatUnits(tokenPrice, 18)); 
    const ethPriceInUsd = parseFloat(formatUnits(ethPrice, 8)); 

    const tokenPriceInUsd = tokenPriceInEth * ethPriceInUsd;

    return toResult(`Current price: $${tokenPriceInUsd.toFixed(6)} USD`);
}