import { Address, formatUnits, isAddress } from 'viem';
import { FunctionReturn, toResult, getChainFromName, FunctionOptions } from '@heyanon/sdk';
import { supportedChains } from '../constants';
import { guCoinAbi } from '../abis';
import { getTokenAddress } from './getTokenAddress';

interface Props {
    chainName: string;
    token: Address | string;
}
/**
 * Fetch current token price in ETH.
 * @param props - The request parameters.
 * @param tools - System tools for blockchain interactions. 
 * @returns Token price.
 */
export async function getTokenPrice({ chainName, token }: Props, { getProvider }: FunctionOptions): Promise<FunctionReturn> {
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

    const price = await publicClient.readContract({
        address: token as Address,
        abi: guCoinAbi,
        functionName: 'price',
    }) as bigint;

    return toResult(`Current price: ${formatUnits(price, 18)} ETH`);
}