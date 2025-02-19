import { Address, formatUnits, isAddress } from 'viem';
import { FunctionReturn, toResult, FunctionOptions, EVM, EvmChain } from '@heyanon/sdk';
import { ETH_USD_ORACLE_ADDRESS, supportedChains } from '../constants';
import { ethOracleAbi, guCoinAbi } from '../abis';
import { getTokenAddress } from './getTokenAddress';
const { getChainFromName } = EVM.utils;

interface Props {
    chainName: string;
    token: Address | string;
}

/**
 * Fetch current token price in USD.
 * @param props - The request parameters.
 * @param tools - System tools for blockchain interactions. 
 * @returns Token price.
 */
export async function getTokenPriceInUsd({ chainName, token }: Props, options: FunctionOptions): Promise<FunctionReturn> {
    const {
		evm: { getProvider }
	} = options;

    // Validate chain
    const chainId = getChainFromName(chainName as EvmChain);
    if (!chainId) return toResult(`Unsupported chain name: ${chainName}`, true);
    if (!supportedChains.includes(chainId)) return toResult(`Gu is not supported on ${chainName}`, true);

    // If token is a string, resolve it to an address
    if (!isAddress(token)) {
        const resolvedToken = await getTokenAddress({ symbol: token });
        if (!resolvedToken.success) return toResult(`Couldn't find token address for "${token}". Try again.`, true);
        token = resolvedToken.data;
    }

    const publicClient = getProvider(chainId);

    const tokenPrice = await publicClient.readContract({
        address: token as Address,
        abi: guCoinAbi,
        functionName: 'price',
    }) as bigint;

    const ethPrice = await publicClient.readContract({
        address: ETH_USD_ORACLE_ADDRESS,
        abi: ethOracleAbi,
        functionName: 'latestAnswer',
    }) as bigint;

    // Convert price to proper format
    const tokenPriceInEth = parseFloat(formatUnits(tokenPrice, 18)); 
    const ethPriceInUsd = parseFloat(formatUnits(ethPrice, 8)); 

    const tokenPriceInUsd = tokenPriceInEth * ethPriceInUsd;

    return toResult(`Current price: $${tokenPriceInUsd.toFixed(0)} USD`);
}